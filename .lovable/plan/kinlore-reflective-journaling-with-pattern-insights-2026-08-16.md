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
- `shared_access` — `id`, `user_id`, `code` (32-char high-entropy code, ~160 bits),
  `created_at`, `expires_at` (30 days), `revoked_at`.
- `share_attempts` — `id`, `ip_hash`, `attempted_at`, used only for rate limiting
  redemption attempts; pruned automatically.

Access rules: users read/write only their own rows. Share lookups go through a
server-side function that validates a non-expired, non-revoked code and returns only
aggregate score history — never text, never the owner's identity beyond a display name.

## Analysis

Scores are split by what is actually measurable versus what needs language understanding:

Computed in code, deterministically, before any AI call:
- **Vocabulary richness** — Brunét's Index (W = N^(V^-0.165), where N = tokens and
  V = unique tokens), after lowercasing and stripping punctuation. Lower W means richer
  vocabulary; mapped to a 0–100 display score with a fixed, documented range so values
  are comparable across entries.
- **Sentence complexity** — sentence segmentation, then mean sentence length in words,
  standard deviation of sentence length, and clause density (subordinating conjunctions
  and commas per sentence), combined into a 0–100 score by a fixed formula.
Both raw metrics (token count, type count, Brunét W, mean/SD sentence length, clause
density) are stored alongside the scores so the numbers are auditable, not opaque.

Sent to the AI, which is the only part requiring judgment:
- **Clarity** and **sentiment**, returned as 0–100 integers plus a short plain-language
  note. The AI never sees or influences the two computed metrics.

The server stores only numbers; the text is discarded after scoring and never written to
the database, localStorage, or logs. Draft text lives in React state only and is cleared
on save.

## Share-code security

- Codes are generated with a CSPRNG: 32 characters from a 32-symbol unambiguous alphabet
  (~160 bits), formatted in dash-separated groups so they're readable and copyable but
  not guessable. Codes are stored hashed; the plaintext is shown once on creation and
  retrievable only by the owner while active.
- The public redemption server function rate-limits by hashed client IP: max 10 attempts
  per 15 minutes and 50 per day, counted on every attempt regardless of validity, with a
  generic "too many attempts, try again later" response. Successful redemptions do not
  reset the window.
- Failed and successful attempts return the same timing-insensitive generic error shape,
  so the endpoint doesn't confirm which codes exist.


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
