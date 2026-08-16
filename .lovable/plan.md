# KinLore: Speech Tempo, SBAR Handoff, Cognitive Footprint

## What gets built

### 1. Speech tempo (WPM)
- The dictation button on the Home dashboard starts a timer when recording starts and stops it when recording ends (accumulating across pause/resume so a single entry can be dictated in several bursts).
- On save, WPM is computed as `(words / seconds) * 60`, rounded, and sent to the analysis server function alongside the text.
- Typed-only entries send `null` — no fabricated value.
- Displayed as "Speech tempo" on My Entries cards (shows "—" when absent) and as a trend line + radar axis.

### 2. Physician SBAR generator
- A "Generate Physician SBAR" button on the My Entries page.
- Aggregates the last 7 days of entries: average Brunét's index, average idea density, average speech tempo, plus entry count and date range. Computed client-side from data already loaded — no new backend call, no model involved.
- Opens a dialog with the non-diagnostic disclaimer above a plain-text SBAR block (Situation / Background / Assessment / Recommendation) and a "Copy" button.
- Assessment wording stays strictly descriptive (direction of change in measured numbers), never interpretive or diagnostic.
- If there are no entries in the last 7 days, the dialog explains that instead of emitting an empty report.

### 3. Cognitive Footprint radar chart
- A Recharts `RadarChart` on the Home dashboard with 4 axes: Lexical Diversity (Brunét's), Idea Density, Sentence Complexity, Speech Tempo.
- Each axis is normalised to 0–100 against a fixed, documented reference range so the axes are comparable; raw values shown in the tooltip.
- Plots the latest entry against the user's rolling 7-day average, and re-renders automatically when a new entry is saved (the existing query cache already invalidates on save).
- Hidden with an explanatory line until at least one entry exists.

### 4. Disclaimers and UI cleanup
- Audit every screen that renders numbers (Home, My Entries, Sharing, Shared view, SBAR dialog) and confirm the hardcoded disclaimer is present; add it where missing.
- Clarity/sentiment are already absent from the UI; verified as part of this change.

## Database change

One migration adds a single column:

- `journal_sessions.speech_tempo_wpm numeric NULL`

## Note on the schema you listed

Your spec names some columns differently from what already exists and holds your data. I plan to keep the existing names rather than rename and risk the current rows:

| Your spec | Already in the table | Same thing? |
|---|---|---|
| `unique_word_count` | `unique_words` | yes |
| `brunets_index` | `brunet_w` | yes |
| `unique_propositions`, `repetition_count`, `word_count`, `user_id`, `created_at` | present | yes |
| `speech_tempo_wpm` | missing | added by this plan |

For `shared_access`, your spec stores a 16-char `share_code` in plaintext. The table currently stores a SHA-256 `code_hash` plus a short `code_prefix` for display, with a 32-char (~160-bit) code shown once at creation, IP rate limiting on redemption, and `expires_at` / `revoked_at` already present. That is strictly stronger than plaintext 16-char codes, so I'll keep it. Tell me if you want it changed to match the spec literally.

## Technical detail

- `src/routes/_authenticated/app.index.tsx` — dictation timer refs, WPM computation, radar chart placement.
- `src/lib/analysis.functions.ts` — accept optional `speechTempoWpm` in the input validator, persist it.
- `src/hooks/useEntries.ts` — select the new column, extend `EntryRow`.
- `src/components/CognitiveFootprint.tsx` — new radar chart component with the normalisation table.
- `src/components/SbarDialog.tsx` — new component: 7-day aggregation, formatted SBAR text, copy-to-clipboard.
- `src/components/TrendChart.tsx` — add speech tempo to the counts chart.
- `src/lib/kinlore.ts` — label for `speech_tempo_wpm`.
- Raw text still never leaves the server function; only numbers are stored.
