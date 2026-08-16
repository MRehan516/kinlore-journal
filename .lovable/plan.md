# KinLore — reflective journaling with pattern insights

A private journaling app where you write to a daily prompt, and only anonymous numeric
scores about *how* you wrote are kept — never the words themselves. You can optionally
share a read-only trend summary with someone you trust via an expiring code.

Every screen with scores shows: "This is a self-reflection tool, not a medical diagnosis.
If you're concerned about memory or cognitive changes, please talk to a doctor."

## Backend (Lovable Cloud)

Enable Lovable Cloud for auth, database, and server logic.

Tables:
- `journal_sessions` — `id`, `user_id`, `created_at`, `prompt`, `word_count`,
  and scores: `vocabulary_richness`, `sentence_complexity`, `clarity`, `sentiment`
  (0–100 integers). No raw text column exists at all.
- `shared_access` — `id`, `user_id`, `code` (short readable code), `created_at`,
  `expires_at` (30 days), `revoked_at`.

Access rules: users read/write only their own rows. Share lookups go through a
server-side function that validates a non-expired, non-revoked code and returns only
aggregate score history — never text, never the owner's identity beyond a display name.

## Analysis

Saving an entry sends the text to a server function that calls the built-in AI, which
returns the four numeric scores plus a short plain-language note. The server stores only
the numbers; the text is discarded after scoring and never written to the database,
localStorage, or logs. Draft text lives in React state only and is cleared on save.

## Pages

- **Landing (`/`)** — one honest sentence, framing note, "Start journaling" CTA.
- **Auth (`/auth`)** — email magic link.
- **Home (`/app`)** — today's prompt, textarea, speech-to-text button (browser
  Web Speech API) with typing always available and a clear message if speech isn't
  supported; "Save entry"; friendly trend chart of recent entries; "Share with someone
  I trust" which creates a code and always shows "Revoke access" while a share is live.
- **My Entries (`/app/entries`)** — list of past sessions: date, prompt, scores. Notes
  that text was never saved.
- **Sharing (`/app/sharing`)** — active/expired codes, expiry dates, revoke.
- **About (`/app/about`)** — what this is and isn't, plus links to Alzheimer's
  Association, NIA, and NHS memory-concerns pages.
- **Shared view (`/shared`)** — public, unauthenticated. Enter a code, see the same
  friendly trend summary read-only with the disclaimer.

Sidebar (Home, My Entries, Sharing, About) wraps the signed-in area, collapsible.

## States

Real loading skeletons, error messages with retry, and empty states ("no entries yet —
write your first one"). No seeded or example data anywhere.

## Design

Warm parchment: cream background `#FAF6EF`, ink brown text `#3A322A`, sage `#7C8F6B`,
warm ochre accent `#C8874A`. Serif headings, humanist sans body, generous spacing,
soft rounded cards. Language throughout is gentle and descriptive, never clinical.

## Technical notes

- TanStack Start routes; signed-in pages under an `_authenticated` layout.
- Scoring, share-code creation/revocation, and code redemption are server functions;
  the redemption function is public and rate-limited by code validity checks.
- Charts via Recharts; per-route SEO metadata on every page.
