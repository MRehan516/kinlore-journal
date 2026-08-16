# Methodology & Research page

A new authenticated page explaining exactly how each KinLore number is produced, written in an academic but readable register.

## Navigation

- New sidebar entry "Methodology & Research" with the Lucide `BookOpen` icon, placed after About in the existing Journal group.
- New route `/app/methodology` (file `src/routes/_authenticated/app.methodology.tsx`) with its own head metadata (title, description, og:title, og:description).

## Page layout

Same max-width column, warm parchment surface and serif headings used across the app — no new colors, only existing semantic tokens (`background`, `card`, `border`, `muted-foreground`, `secondary`).

- Page header: "Methodology & Research" plus a one-line statement that every number is either arithmetic or a counted extraction, never an opinion.
- The mandatory non-diagnostic disclaimer via the existing `Disclaimer` component, directly under the header and repeated at the page foot.
- Four academic-styled cards, each with a bold header, body prose with generous line spacing, an optional formula block, and a citation callout (a left-bordered, muted block set in smaller type).

### 1. Lexical Diversity (Brunét's Index)
Prose on tracking vocabulary richness from total words (N) against unique words (V), and why the exponent makes the measure stable across entries of different length. Formula rendered in a distinct monospace block:

```text
W = N^(V^-0.165)
```

Citation callout referencing Brunét (1978) and the corpus-linguistics tradition treating vocabulary contraction as a longitudinal signal — framed as research context, not diagnosis.

### 2. Semantic Proposition Extraction (Featherless AI)
Explains the structured tool-calling path: entry text goes to server-side inference on `meta-llama/Meta-Llama-3.1-8B-Instruct` with a fixed schema that returns only two integers — distinct propositions (Idea Density) and restated concepts (Repetition Count). Emphasises the hard separation: arithmetic is computed in code, the model only counts, and it is never asked for an opinion about the writer. Notes the call is non-fatal — if it fails, the deterministic numbers still save.

### 3. Acoustic Speech Tempo (WPM)
Explains that when dictation is used the browser's speech recognition session is timed, words are divided by elapsed speaking seconds, and the result is stored as words per minute to capture pacing across dictation bursts. Typed entries record no tempo.

### 4. Data Privacy Architecture (Zero-Data Retention)
Describes the pipeline: text is posted to the server function, held in memory for metric computation and extraction, then discarded when the request ends. Only integers and decimals are written to the database; nothing is kept in browser storage.

## Technical notes

- One new route file and a small edit to `src/components/AppSidebar.tsx` (add the item and import the icon).
- Small local presentational helpers inside the route file for the formula block and citation callout; no new dependencies, no backend changes.
