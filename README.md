# KinLore Journal

Project name is KinLore and here is prompt to build it 

Build a React + Tailwind app called KinLore using Supabase (Auth + Postgres + Edge Functions).

WHAT THIS IS: a personal journaling tool that shows you patterns in how you write over

time. It is explicitly NOT a diagnostic or medical tool, and every screen that shows

scores must include a visible line: "This is a self-reflection tool, not a medical

diagnosis. If you're concerned about memory or cognitive changes, please talk to a doctor."

AUTH: standard Supabase email/magic-link auth. No hidden accounts, no second role —

one user type, who may optionally generate a share code for someone else to view a

read-only summary.

PAGES:

1. Landing — one sentence on what it is, honest framing, one CTA ("Start journaling").

2. Home/Dashboard (post-login):

   - Today's prompt + text area (with optional browser speech-to-text button and a

     clearly visible manual-typing fallback if speech-to-text fails or isn't supported)

   - "Save entry" button — calls the analyze-entry Edge Function, stores only the

     returned scores (never raw text) to journal_sessions

   - A simple, friendly trend chart of past entries' scores over time — plain language

     framing ("your recent entries"), never clinical or alarming language

   - "Share with someone I trust" button — generates a share code via shared_access,

     displayed clearly with a "Revoke access" option always visible once a share exists

3. Shared view (separate, unauthenticated route, accessed by entering a share code) —

   shows the same friendly trend summary, read-only, no raw text ever, same non-diagnostic

   disclaimer visible.

SIDEBAR: Home, My Entries (history list), Sharing (manage active share codes), About

(explains the tool honestly, links to real resources for memory/cognitive concerns).

DATA RULE: raw journal text must never be persisted anywhere — not in Supabase, not in

localStorage. Only the numeric scores returned by the Edge Function get stored.

Real error/loading/empty states throughout — no placeholder or seeded example data

anywhere in the shipped build.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/aff5f6fd-8ac7-4da3-a189-71f6a5ed50e8).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
