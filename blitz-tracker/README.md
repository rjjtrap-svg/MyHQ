# Blitz Tracker

Mobile-friendly deal tracker for fiber sales blitzes. Reps log every door —
sale or not — from their phone, standing at the doorstep.

**Live app:** https://blitz-tracker-jet.vercel.app

## ⚠️ One-time setup step before your team can use it

The app is deployed and working, but Vercel puts new projects behind
**Vercel Authentication** by default — that's why the link currently shows a
login wall to anyone who isn't logged into this Vercel account. Reps won't
have Vercel accounts, so you need to turn that off once:

1. Go to https://vercel.com/rjjtrap-svgs-projects/blitz-tracker/settings/deployment-protection
2. Turn **Vercel Authentication** off (or scope it to Preview only, leaving
   Production public).
3. Save. The link above will then be open to anyone with the URL — no
   login, no account.

## What's here

- Next.js 14 (App Router) + TypeScript, plain CSS (no build-heavy CSS
  framework, kept the build simple and fast).
- Supabase (`blitz_deals` table) for persistent storage — data survives
  refreshes/redeploys, it's a real Postgres table, not in-memory.
- No login: reps type their name (autocompletes from previous entries via
  a `<datalist>`) and start logging. Their name is remembered in the
  browser (`localStorage`) so they don't retype it every door.
- Deployed on Vercel, straight from source with no GitHub repo required
  for the deploy itself (though the code also lives in this git repo).

## Pages

- **Log Deal** (`/`) — the doorstep flow. Pick an outcome (Sale / Not Home
  / Not Interested / Callback / Other), fill in address + rep name always;
  sale-only fields (customer name/phone, plan, install date) appear only
  when "Sale" is selected. One tap to save, form resets and stays ready
  for the next door.
- **Dashboard** (`/dashboard`) — doors worked, sales, conversion %, sales
  leaderboard by rep, doors-worked leaderboard by rep, deals by day.
  Filterable by Today / Last 7 Days / All Time.
- **All Deals** (`/deals`) — every logged deal/outcome, filterable by rep
  and by a specific date.

## Data & security model

- Table: `public.blitz_deals` in the Supabase project already wired to
  this repo (`ybrairokaqjoyvhqbvai`).
- RLS is enabled with two policies: `anon` can `INSERT` and `SELECT`, and
  nothing else (no update/delete from the client). This is intentionally
  open compared to this repo's other Supabase tables (which lock
  everything down to the service role) — there's no login, so the app
  talks to Supabase directly from the browser using the public anon key.
  Anyone with the app URL can read/add deals; there's no per-rep access
  control. That matches "no auth needed" from the brief, but means: don't
  put anything more sensitive than doorstep sales data in this table.

## Known gaps

- No edit/delete for a logged deal — a mis-typed entry has to stay or be
  fixed directly in Supabase.
- No offline support — a rep with zero signal at a doorstep needs to wait
  for bars before saving. Could add local queueing + retry if this becomes
  a real problem in the field.
- `npm audit` flags some upstream Next.js/PostCSS CVEs that only clear on
  a major-version bump to Next 16 (not done here to avoid shipping an
  untested breaking change same-day). Worth revisiting later.

## Local development

```
cd blitz-tracker
npm install
npm run dev
```

No `.env` needed — the Supabase URL and anon key are intentionally
hardcoded in `lib/supabase.ts` (see comment there for why that's fine for
this key type).

## Redeploying after a code change

This was deployed straight from source via the Vercel MCP tool, not a
connected GitHub repo, so a normal `git push` won't trigger a redeploy.
Ask Claude to redeploy, or connect the Vercel project to this GitHub repo
in the Vercel dashboard if you'd rather it auto-deploy on push.
