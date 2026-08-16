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
  "Do not comment on the writer's mental or cognitive state — only count structural features. " +
  'If you cannot call a tool, reply with JSON only: {"unique_propositions": <int>, "repetition_count": <int>}';

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

/** Llama returns arguments as a JSON string, sometimes wrapped in prose or fences. */
function parseLoose(raw: unknown): Record<string, unknown> | null {
  if (raw && typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return null;
  const text = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    /* fall through to brace extraction */
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(text.slice(start, end + 1));
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch (err) {
      console.error(
        "[featherless] brace-extraction JSON.parse failed:",
        err instanceof Error ? err.message : "unknown",
      );
    }
  }
  return null;
}

function pick(obj: Record<string, unknown>): StructuralFeatures {
  // Some models nest the payload under the tool name or "parameters"/"arguments".
  const nestedKeys = ["extract_language_features", "parameters", "arguments", "properties"];
  for (const key of nestedKeys) {
    const nested = obj[key];
    if (
      nested &&
      typeof nested === "object" &&
      obj["unique_propositions"] === undefined &&
      obj["repetition_count"] === undefined
    ) {
      return pick(nested as Record<string, unknown>);
    }
  }
  return {
    uniquePropositions: toCount(obj["unique_propositions"]),
    repetitionCount: toCount(obj["repetition_count"]),
  };
}

export async function extractStructuralFeatures(text: string): Promise<StructuralFeatures> {
  const empty: StructuralFeatures = { uniquePropositions: null, repetitionCount: null };

  const apiKey = process.env["FEATHERLESS_API_KEY"];
  const model = process.env["FEATHERLESS_MODEL"] ?? "meta-llama/Meta-Llama-3.1-8B-Instruct";
  if (!apiKey) {
    console.error("[featherless] FEATHERLESS_API_KEY is not set — skipping extraction.");
    return empty;
  }

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text },
    ],
    tools: [{ type: "function", function: TOOL_DEFINITION }],
    tool_choice: { type: "function", function: { name: "extract_language_features" } },
    temperature: 0,
    max_tokens: 200,
  };

  // Log the request shape without ever logging the entry text itself.
  console.log(
    "[featherless] request →",
    JSON.stringify({
      model,
      tool_choice: body.tool_choice,
      messages: [
        { role: "system", content: `<system prompt ${SYSTEM_PROMPT.length} chars>` },
        { role: "user", content: `<entry text redacted, ${text.length} chars>` },
      ],
      temperature: body.temperature,
      max_tokens: body.max_tokens,
    }),
  );

  try {
    // No AbortController / timeout here on purpose: the model needs as long as it needs.
    const response = await fetch("https://api.featherless.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    console.log("[featherless] status:", response.status, response.statusText);
    console.log("[featherless] raw response:", rawText.slice(0, 4000));

    if (!response.ok) {
      console.error("[featherless] non-OK response — returning nulls.");
      return empty;
    }

    let payload: any;
    try {
      payload = JSON.parse(rawText);
    } catch (err) {
      console.error(
        "[featherless] response body was not JSON:",
        err instanceof Error ? err.message : "unknown",
      );
      return empty;
    }

    const message = payload?.choices?.[0]?.message;
    const toolArgs = message?.tool_calls?.[0]?.function?.arguments;

    let obj = parseLoose(toolArgs);
    if (!obj) {
      // Fallback: some Llama 3.1 deployments emit the JSON as plain content.
      console.warn("[featherless] no parsable tool_call arguments — trying message.content.");
      obj = parseLoose(message?.content);
    }

    if (!obj) {
      console.error("[featherless] could not extract structured features — returning nulls.");
      return empty;
    }

    const result = pick(obj);
    console.log("[featherless] parsed features:", JSON.stringify(result));
    return result;
  } catch (err) {
    console.error(
      "[featherless] call failed:",
      err instanceof Error ? `${err.name}: ${err.message}` : "unknown",
    );
    return empty;
  }
}
