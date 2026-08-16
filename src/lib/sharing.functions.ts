import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface CreatedShare {
  id: string;
  code: string;
  code_prefix: string;
  expires_at: string;
}

export const createShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { label?: string }) => ({
    label: String(input?.label ?? "").trim().slice(0, 60) || null,
  }))
  .handler(async ({ data, context }): Promise<CreatedShare> => {
    const { generateShareCode, hashShareCode } = await import("@/lib/share-codes.server");
    const code = generateShareCode();
    const codeHash = await hashShareCode(code);

    const { data: row, error } = await context.supabase
      .from("shared_access")
      .insert({
        user_id: context.userId,
        code_hash: codeHash,
        code_prefix: code.slice(0, 4),
        label: data.label,
      })
      .select("id, code_prefix, expires_at")
      .single();

    if (error || !row) {
      throw new Error("We couldn't create a share code. Please try again.");
    }

    // The full code is returned once here and never stored in plain text.
    return { id: row.id, code, code_prefix: row.code_prefix, expires_at: row.expires_at };
  });

export const revokeShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    const id = String(input?.id ?? "");
    if (!id) throw new Error("Missing share id.");
    return { id };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("shared_access")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw new Error("We couldn't revoke that share. Please try again.");
    return { ok: true };
  });
