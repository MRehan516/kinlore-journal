import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";

export interface SharedPoint {
  created_at: string;
  vocabulary_richness: number;
  sentence_complexity: number;
  unique_propositions: number | null;
  repetition_count: number | null;
  speech_tempo_wpm: number | null;
}

export interface SharedSummary {
  entries: SharedPoint[];
  expires_at: string;
}

/**
 * PUBLIC endpoint. Anyone can call it, so it is rate limited per client IP and
 * returns a single generic error for every failure mode, so it never confirms
 * whether a given code exists.
 */
export const redeemShareCode = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => {
    const code = String(input?.code ?? "").trim();
    if (!code) throw new Error("Please enter a share code.");
    if (code.length > 80) throw new Error("That doesn't look like a share code.");
    return { code };
  })
  .handler(async ({ data }): Promise<SharedSummary> => {
    const { hashShareCode, hashClientIp, RATE_LIMIT_WINDOW } = await import(
      "@/lib/share-codes.server"
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ip =
      getRequestIP({ xForwardedFor: true }) ??
      getRequestHeader("cf-connecting-ip") ??
      "unknown";
    const ipHash = await hashClientIp(ip);
    const now = Date.now();

    // Every attempt is counted, valid or not — successes do not reset the window.
    await supabaseAdmin.from("share_attempts").insert({ ip_hash: ipHash });

    const shortWindow = new Date(now - RATE_LIMIT_WINDOW.shortMinutes * 60_000).toISOString();
    const dayWindow = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const [{ count: shortCount }, { count: dayCount }] = await Promise.all([
      supabaseAdmin
        .from("share_attempts")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("attempted_at", shortWindow),
      supabaseAdmin
        .from("share_attempts")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("attempted_at", dayWindow),
    ]);

    if (
      (shortCount ?? 0) > RATE_LIMIT_WINDOW.shortMax ||
      (dayCount ?? 0) > RATE_LIMIT_WINDOW.dayMax
    ) {
      throw new Error("Too many attempts. Please try again later.");
    }

    // Housekeeping: drop attempt rows older than 24 hours.
    await supabaseAdmin
      .from("share_attempts")
      .delete()
      .lt("attempted_at", new Date(now - 24 * 60 * 60_000).toISOString());

    const genericFailure = new Error("That code isn't valid, or it has expired or been revoked.");

    const codeHash = await hashShareCode(data.code);
    const { data: share } = await supabaseAdmin
      .from("shared_access")
      .select("user_id, expires_at, revoked_at")
      .eq("code_hash", codeHash)
      .maybeSingle();

    if (!share) throw genericFailure;
    if (share.revoked_at) throw genericFailure;
    if (new Date(share.expires_at).getTime() < now) throw genericFailure;

    const { data: rows, error } = await supabaseAdmin
      .from("journal_sessions")
      .select("created_at, vocabulary_richness, sentence_complexity, unique_propositions, repetition_count, speech_tempo_wpm")
      .eq("user_id", share.user_id)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error) throw genericFailure;

    return { entries: (rows ?? []) as SharedPoint[], expires_at: share.expires_at };
  });
