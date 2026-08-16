/**
 * Server-only: structural feature extraction (distinct ideas + repeated ideas)
 * via Featherless. Mirrors the analyze-entry contract. The text is never logged
 * and never persisted — only the returned counts are.
 *
 * Non-fatal by design: if the key is missing or the call fails, we return nulls
 * so the deterministic metrics still save.
 */

export interface StructuralFeatures {
  uniquePropositions: number | null;
  repetitionCount: number | null;
}

const SYSTEM_PROMPT =
  "You extract structural language features from a personal journal entry for a self-reflection tool. " +
  "This is NOT a diagnostic or clinical tool. Call extract_language_features with an honest count of " +
  "distinct propositions (ideas/facts) and how many ideas are repeated within the same entry. " +
  "Do not comment on the writer's mental or cognitive state — only count structural features.";

const TOOL_DEFINITION = {
  name: "extract_language_features",
  description:
    "Extract semantic features from a journal entry for self-reflection purposes only — not diagnostic.",
  parameters: {
    type: "object",
    properties: {
      unique_propositions: {
        type: "integer",
        description: "Count of distinct ideas/facts expressed",
      },
      repetition_count: {
        type: "integer",
        description: "Count of ideas repeated within the entry",
      },
    },
    required: ["unique_propositions", "repetition_count"],
  },
};

function toCount(value: unknown): number | null {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(n, 10_000);
}

export async function extractStructuralFeatures(text: string): Promise<StructuralFeatures> {
  const empty: StructuralFeatures = { uniquePropositions: null, repetitionCount: null };

  const apiKey = process.env["FEATHERLESS_API_KEY"];
  const model = process.env["FEATHERLESS_MODEL"] ?? "meta-llama/Meta-Llama-3.1-8B-Instruct";
  if (!apiKey) return empty;

  try {
    const response = await fetch("https://api.featherless.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        tools: [{ type: "function", function: TOOL_DEFINITION }],
        tool_choice: { type: "function", function: { name: "extract_language_features" } },
      }),
    });

    if (!response.ok) {
      console.error("Featherless API error:", response.status);
      return empty;
    }

    const payload = (await response.json()) as {
      choices?: Array<{
        message?: { tool_calls?: Array<{ function?: { arguments?: string } }> };
      }>;
    };
    const args = payload.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return empty;

    const parsed = JSON.parse(args) as Record<string, unknown>;
    return {
      uniquePropositions: toCount(parsed["unique_propositions"]),
      repetitionCount: toCount(parsed["repetition_count"]),
    };
  } catch (err) {
    console.error("Featherless call failed:", err instanceof Error ? err.message : "unknown");
    return empty;
  }
}
