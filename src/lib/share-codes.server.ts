/** Server-only helpers for share-code generation, hashing and rate limiting. */

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 unambiguous symbols
const CODE_LENGTH = 32; // 32 * 5 bits = 160 bits of entropy

export function generateShareCode(): string {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let raw = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    raw += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return raw.match(/.{1,4}/g)!.join("-");
}

export function normalizeShareCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hashShareCode(code: string): Promise<string> {
  return sha256Hex(`kinlore-share:${normalizeShareCode(code)}`);
}

export function hashClientIp(ip: string): Promise<string> {
  return sha256Hex(`kinlore-ip:${ip}`);
}

export const RATE_LIMIT_WINDOW = {
  shortMinutes: 15,
  shortMax: 10,
  dayMax: 50,
};
