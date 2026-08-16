/**
 * Deterministic, code-computed writing metrics.
 *
 * Nothing here calls a model. These numbers are measured from the text with
 * fixed formulas so they are reproducible and auditable. The text itself is
 * never returned or persisted — only the numbers below.
 */

export interface TextMetrics {
  wordCount: number;
  uniqueWords: number;
  brunetW: number;
  meanSentenceLength: number;
  sdSentenceLength: number;
  clauseDensity: number;
  vocabularyRichness: number;
  sentenceComplexity: number;
}

const SUBORDINATORS = new Set([
  "although",
  "though",
  "because",
  "since",
  "unless",
  "whereas",
  "while",
  "whilst",
  "if",
  "when",
  "whenever",
  "before",
  "after",
  "until",
  "that",
  "which",
  "who",
  "whom",
  "whose",
  "so",
  "as",
]);

function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round(value: number, places = 3): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s-]/gu, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^[-']+|[-']+$/g, ""))
    .filter((token) => token.length > 0);
}

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => tokenize(sentence).length > 0);
}

/**
 * Brunét's Index: W = N^(V^-0.165)
 * N = total tokens, V = distinct tokens. A LOWER W means richer vocabulary.
 * Typical prose sits roughly between 9 (very rich) and 20 (very repetitive).
 */
export function brunetIndex(totalTokens: number, distinctTokens: number): number {
  if (totalTokens <= 0 || distinctTokens <= 0) return 0;
  return Math.pow(totalTokens, Math.pow(distinctTokens, -0.165));
}

const BRUNET_RICH = 9;
const BRUNET_PLAIN = 20;

function brunetToScore(w: number): number {
  if (w <= 0) return 0;
  return clamp(((BRUNET_PLAIN - w) / (BRUNET_PLAIN - BRUNET_RICH)) * 100);
}

/**
 * Sentence complexity blends three measured quantities:
 *  - mean sentence length in words (50%)
 *  - variation in sentence length, as standard deviation (20%)
 *  - clause density: subordinating conjunctions + commas per sentence (30%)
 */
function complexityScore(mean: number, sd: number, clauseDensity: number): number {
  const meanPart = clamp(((mean - 5) / 20) * 100);
  const sdPart = clamp((sd / 10) * 100);
  const clausePart = clamp((clauseDensity / 3) * 100);
  return clamp(meanPart * 0.5 + sdPart * 0.2 + clausePart * 0.3);
}

export function computeTextMetrics(text: string): TextMetrics {
  const tokens = tokenize(text);
  const distinct = new Set(tokens);
  const sentences = splitSentences(text);

  const wordCount = tokens.length;
  const uniqueWords = distinct.size;
  const brunetW = brunetIndex(wordCount, uniqueWords);

  const lengths = sentences.map((sentence) => tokenize(sentence).length);
  const mean = lengths.length ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0;
  const variance = lengths.length
    ? lengths.reduce((sum, len) => sum + (len - mean) ** 2, 0) / lengths.length
    : 0;
  const sd = Math.sqrt(variance);

  let clauseMarkers = 0;
  for (const sentence of sentences) {
    clauseMarkers += (sentence.match(/,/g) ?? []).length;
    for (const token of tokenize(sentence)) {
      if (SUBORDINATORS.has(token)) clauseMarkers += 1;
    }
  }
  const clauseDensity = sentences.length ? clauseMarkers / sentences.length : 0;

  return {
    wordCount,
    uniqueWords,
    brunetW: round(brunetW),
    meanSentenceLength: round(mean, 2),
    sdSentenceLength: round(sd, 2),
    clauseDensity: round(clauseDensity, 2),
    vocabularyRichness: Math.round(brunetToScore(brunetW)),
    sentenceComplexity: Math.round(complexityScore(mean, sd, clauseDensity)),
  };
}
