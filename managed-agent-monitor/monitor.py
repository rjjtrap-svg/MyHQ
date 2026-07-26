#!/usr/bin/env python3
"""Monitor a Managed Agents deployment and converse with its latest session.

By default, attaches to the session of the deployment's most recent scheduled
run. If the deployment has no runs yet, falls back to creating a fresh ad hoc
session against AGENT_ID/ENVIRONMENT_ID. Streams agent.message text as it
arrives and exits cleanly when the session goes idle or on error.

Requires: pip install anthropic
Auth: set ANTHROPIC_API_KEY in the environment.

Usage:
  python monitor.py                                  # attach to latest run, just listen
  python monitor.py --message "..."                  # attach, then send this message
  python monitor.py --new --message "..."             # force a fresh ad hoc session
"""

import argparse
import os
import sys
from typing import Optional

from anthropic import Anthropic

DEPLOYMENT_ID = "depl_01Ejr5NLF2R2CnRerAM4AGGp"
AGENT_ID = "agent_01XyRX1aWbz2ubMAB4ddyWXT"
ENVIRONMENT_ID = "env_01RWT3z2Z55cB78jNdGyTuKM"


def get_latest_run_session_id(client: Anthropic) -> Optional[str]:
    """Return the session id of DEPLOYMENT_ID's most recent scheduled run, or None
    if it has no runs yet.

    NOTE: `deployment_runs.list` and its returned run objects are confirmed to
    exist, but the exact attribute names for "when was this run created" and
    "which session does it use" weren't independently confirmed beyond the
    happy path shown in the docs. `run.created_at` / `run.session_id` below are
    the most likely names (mirroring the rest of the SDK's conventions) — patch
    these two lines if the live objects use different field names.
    """
    runs = list(client.beta.deployment_runs.list(deployment_id=DEPLOYMENT_ID))
    if not runs:
        return None
    runs.sort(key=lambda r: getattr(r, "created_at", ""), reverse=True)
    latest = runs[0]
    return getattr(latest, "session_id", None) or getattr(getattr(latest, "session", None), "id", None)


def create_ad_hoc_session(client: Anthropic) -> str:
    session = client.beta.sessions.create(agent=AGENT_ID, environment_id=ENVIRONMENT_ID)
    return session.id


def stream_session(client: Anthropic, session_id: str, message: Optional[str]) -> None:
    """Stream session events, optionally sending one user.message first, printing
    agent text as it arrives. Returns when the session goes idle."""
    with client.beta.sessions.events.stream(session_id, event_deltas=["agent.message"]) as stream:
        if message:
            client.beta.sessions.events.send(
                session_id,
                events=[{"type": "user.message", "content": [{"type": "text", "text": message}]}],
            )

        for event in stream:
            match event.type:
                case "event_delta":
                    text = getattr(getattr(event.delta, "content", None), "text", None)
                    if text:
                        print(text, end="", flush=True)
                case "session.status_idle":
                    stop_reason = getattr(getattr(event, "stop_reason", None), "type", None)
                    print(f"\n\n[session idle - stop_reason={stop_reason}]")
                    return


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--new", action="store_true",
        help="Always create a fresh ad hoc session instead of attaching to the latest scheduled run.",
    )
    parser.add_argument("--message", help="A user.message to send once attached/created.")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Set ANTHROPIC_API_KEY in your environment first.", file=sys.stderr)
        sys.exit(1)

    client = Anthropic(api_key=api_key)

    try:
        session_id = None if args.new else get_latest_run_session_id(client)
        if session_id:
            print(f"Attaching to latest scheduled run's session: {session_id}")
        else:
            session_id = create_ad_hoc_session(client)
            print(f"No existing runs found - created a new ad hoc session: {session_id}")

        stream_session(client, session_id, args.message)
    except KeyboardInterrupt:
        print("\n[interrupted]")
    except Exception as exc:
        print(f"[error: {exc}]", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
