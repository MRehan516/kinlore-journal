/**
 * Server-only: the ONLY place journal text is sent to a model, and only for the
 * two things code cannot measure — clarity and tone. The text is not logged and
 * not persisted; only the returned numbers are.
 */

export interface JudgedScores {
  clarity: number;
  sentiment: number;
  note: string | null;
}

function clampScore(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, n));
}

export async function judgeClarityAndSentiment(text: string): Promise<JudgedScores> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    throw new Error("Scoring is unavailable right now. Please try again shortly.");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.5-flash",
      messages: [
        {
          role: "system",
          content:
            "You rate a personal journal entry on exactly two dimensions. " +
            "clarity: 0-100, how easy the writing is to follow (structure, coherence, resolved references). " +
            "sentiment: 0-100, how warm or positive the tone reads (0 very heavy, 50 neutral, 100 very warm). " +
            "note: one short, gentle, non-clinical sentence about the writing itself. " +
            "Never diagnose, never mention health, memory, or cognition. " +
            "Respond with JSON only: {\"clarity\":number,\"sentiment\":number,\"note\":string}",
        },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (response.status === 429) {
    throw new Error("Too many entries at once. Please wait a moment and try again.");
  }
  if (response.status === 402) {
    throw new Error("Scoring is temporarily unavailable. Please try again later.");
  }
  if (!response.ok) {
    throw new Error("We couldn't score this entry right now. Please try again.");
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content ?? "";

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]) as Record<string, unknown>;
      } catch {
        parsed = {};
      }
    }
  }

  const note = typeof parsed["note"] === "string" ? (parsed["note"] as string).slice(0, 240) : null;

  return {
    clarity: clampScore(parsed["clarity"]),
    sentiment: clampScore(parsed["sentiment"]),
    note,
  };
}
