export const DISCLAIMER =
  "This is a self-reflection tool, not a medical diagnosis. If you're concerned about memory or cognitive changes, please talk to a doctor.";

export const PROMPTS = [
  "What is something small that went well today?",
  "Describe a place you walked past recently. What did you notice?",
  "Tell the story of a meal you remember — who was there?",
  "What was the last conversation that stayed with you?",
  "Describe your morning, from waking up to now.",
  "What is a song, book, or film you keep coming back to, and why?",
  "Write about someone in your family and one thing they taught you.",
  "What are you looking forward to this week?",
  "Describe the weather today and how it changed what you did.",
  "What's a task you finished recently? Walk through how you did it.",
  "Tell me about a room in a house you used to live in.",
  "What made you laugh most recently?",
  "Describe something you made with your hands.",
  "What's a decision you're weighing at the moment?",
];

/** Stable prompt of the day — same prompt for everyone on a given date. */
export function promptForDate(date: Date): string {
  const days = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000,
  );
  return PROMPTS[days % PROMPTS.length]!;
}

export const SCORE_LABELS: Record<string, { label: string; help: string }> = {
  vocabulary_richness: {
    label: "Word variety",
    help: "Measured in code with Brunét's Index — how many different words you used relative to length.",
  },
  sentence_complexity: {
    label: "Sentence structure",
    help: "Measured in code: average sentence length, how much it varies, and clause density.",
  },
  unique_propositions: {
    label: "Idea density",
    help: "Extracted by the Featherless language model: how many distinct ideas the entry expresses.",
  },
  repetition_count: {
    label: "Semantic repetition",
    help: "Extracted by the Featherless language model: how many ideas are repeated within the same entry.",
  },
  speech_tempo_wpm: {
    label: "Speech tempo",
    help: "Measured in the browser while you dictate: words spoken per minute. Empty for typed entries.",
  },
};

