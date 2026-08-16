import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computeTextMetrics } from "@/lib/text-metrics";
import { judgeClarityAndSentiment } from "@/lib/ai-judge.server";

export interface AnalyzeResult {
  id: string;
  created_at: string;
  prompt: string;
  word_count: number;
  vocabulary_richness: number;
  sentence_complexity: number;
  clarity: number;
  sentiment: number;
  brunet_w: number;
  mean_sentence_length: number;
  note: string | null;
}

export const analyzeEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string; prompt: string }) => {
    const text = String(input?.text ?? "").trim();
    const prompt = String(input?.prompt ?? "").trim();
    if (text.length < 40) throw new Error("Please write a little more before saving (at least 40 characters).");
    if (text.length > 20_000) throw new Error("That entry is too long to analyse. Try under 20,000 characters.");
    if (!prompt) throw new Error("Missing prompt.");
    return { text, prompt };
  })
  .handler(async ({ data, context }): Promise<AnalyzeResult> => {
    // Measured in code — no model involved.
    const metrics = computeTextMetrics(data.text);

    // Only the parts that need language understanding go to the model.
    const judged = await judgeClarityAndSentiment(data.text);

    const { data: row, error } = await context.supabase
      .from("journal_sessions")
      .insert({
        user_id: context.userId,
        prompt: data.prompt,
        word_count: metrics.wordCount,
        unique_words: metrics.uniqueWords,
        brunet_w: metrics.brunetW,
        mean_sentence_length: metrics.meanSentenceLength,
        sd_sentence_length: metrics.sdSentenceLength,
        clause_density: metrics.clauseDensity,
        vocabulary_richness: metrics.vocabularyRichness,
        sentence_complexity: metrics.sentenceComplexity,
        clarity: judged.clarity,
        sentiment: judged.sentiment,
        note: judged.note,
      })
      .select(
        "id, created_at, prompt, word_count, vocabulary_richness, sentence_complexity, clarity, sentiment, brunet_w, mean_sentence_length, note",
      )
      .single();

    if (error || !row) {
      throw new Error("We couldn't save the scores for this entry. Please try again.");
    }

    // data.text goes out of scope here. It is never written anywhere.
    return row as AnalyzeResult;
  });
