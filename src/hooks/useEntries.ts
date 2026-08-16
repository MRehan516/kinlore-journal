import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EntryRow {
  id: string;
  created_at: string;
  prompt: string;
  word_count: number;
  vocabulary_richness: number;
  sentence_complexity: number;
  unique_propositions: number | null;
  repetition_count: number | null;
  speech_tempo_wpm: number | null;
  brunet_w: number;
  mean_sentence_length: number;
  note: string | null;
}

export const entriesQueryKey = ["journal_sessions"] as const;

export function useEntries() {
  return useQuery({
    queryKey: entriesQueryKey,
    queryFn: async (): Promise<EntryRow[]> => {
      const { data, error } = await supabase
        .from("journal_sessions")
        .select(
          "id, created_at, prompt, word_count, vocabulary_richness, sentence_complexity, unique_propositions, repetition_count, speech_tempo_wpm, brunet_w, mean_sentence_length, note",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw new Error(error.message);
      return (data ?? []) as EntryRow[];
    },
  });
}

export interface ShareRow {
  id: string;
  code_prefix: string;
  label: string | null;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
}

export const sharesQueryKey = ["shared_access"] as const;

export function useShares() {
  return useQuery({
    queryKey: sharesQueryKey,
    queryFn: async (): Promise<ShareRow[]> => {
      const { data, error } = await supabase
        .from("shared_access")
        .select("id, code_prefix, label, created_at, expires_at, revoked_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as ShareRow[];
    },
  });
}

export function shareStatus(share: ShareRow): "active" | "revoked" | "expired" {
  if (share.revoked_at) return "revoked";
  if (new Date(share.expires_at).getTime() < Date.now()) return "expired";
  return "active";
}
