# Install Pay Tracker

Mobile-friendly personal tool for tracking install commissions/pay. Submit
a confirmation screenshot + install details + what you're getting paid,
then mark it paid once the money actually comes in.

**Live app:** https://blitz-tracker-jet.vercel.app

(Note: the Vercel project is still named `blitz-tracker` from an earlier
version of this tool — same link, changing it would break the URL your
team/you already has bookmarked.)

## What's here

- Next.js 14 (App Router) + TypeScript, plain CSS.
- Supabase (`pay_submissions` table + `install-screenshots` storage
  bucket) for persistent storage, including the actual screenshot images.
- No login — solo tool, no rep/team concept.
- Deployed on Vercel straight from source (see "Redeploying" below).

## Pages

- **Submit** (`/`) — upload a confirmation screenshot, enter customer
  name, address, package/plan, install date, and pay amount, plus
  optional notes. One tap to save.
- **My Installs** (`/installs`) — every submission as a card (screenshot
  thumbnail, package, pay amount, status), with running totals at the top
  ($ pending vs $ paid) and a status filter (All / Submitted / Paid).
- **Install Detail** (`/installs/[id]`) — full screenshot + details, plus
  a **Mark Paid** button (enter the date you got paid) once you've
  actually received the money. Paid entries can be reverted back to
  Submitted if that was a mistake.

## Data & security model

- Table: `public.pay_submissions` in the Supabase project wired to this
  repo (`ybrairokaqjoyvhqbvai`). Columns: customer_name, address,
  plan_sold, install_date, pay_amount, status (`submitted`/`paid`),
  paid_date, screenshot_url, notes.
- Storage: `install-screenshots` bucket, public (screenshots are served
  via a public URL — no signed-URL expiry to manage).
- RLS: `anon` can `INSERT`/`SELECT`/`UPDATE` on `pay_submissions`, and
  `INSERT`/`SELECT` on the screenshot bucket. No delete anywhere. No
  login — the app talks to Supabase directly from the browser with the
  public anon key, same tradeoff as before: anyone with the link can
  read/add/edit entries, including pay amounts. Fine for a personal tool
  only you know the URL to; revisit if that stops being true.

## What changed from the original version

This replaced an earlier "Blitz Tracker" concept (door-to-door outcome
logging, rep leaderboards, doors-worked dashboard) that turned out to
duplicate an existing CRM. The actual gap was simpler: a place to drop a
screenshot + pay info per install and track what's been paid. The old
`blitz_deals` table and its outcome-tracking columns were dropped (it had
no real data in it yet).

## Known gaps

- No edit of a submission's details after creation — only the paid
  status/date. Fix mistakes directly in Supabase if needed.
- No delete.
- 10MB screenshot size limit, checked client-side only.
- `npm audit` flags some upstream Next.js/PostCSS CVEs that only clear on
  a major-version bump to Next 16 (not done here to avoid an untested
  breaking change). Worth revisiting later.

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
connected GitHub repo, so a normal `git push` won't trigger a redeploy —
ask Claude to redeploy after code changes land here.
