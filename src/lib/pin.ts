import { PIN_MAX_LENGTH, PIN_MIN_LENGTH, PIN_PBKDF2_ITERATIONS } from '../constants';

/**
 * PIN and recovery-code hashing (ADR-003): PBKDF2-HMAC-SHA-256 via WebCrypto, offline, no dependency.
 * A 4–6 digit PIN deters misuse at the counter; it does not resist someone who can read device storage.
 */
const SCHEME = 'pbkdf2-sha256';
const SALT_BYTES = 16;
const HASH_BITS = 256;
const RECOVERY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 symbols, no 0/O/1/I
const RECOVERY_LENGTH = 8;
const PIN_PATTERN = new RegExp(`^\\d{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`);

export const isValidPin = (pin: string): boolean => PIN_PATTERN.test(pin);

const toBase64 = (bytes: Uint8Array): string => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(value), (c) => c.charCodeAt(0));

async function derive(secret: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, HASH_BITS);
  return new Uint8Array(bits);
}

/** Returns `pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>` — self-describing so the work factor can be raised later. */
export async function hashSecret(secret: string, iterations: number = PIN_PBKDF2_ITERATIONS): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(secret, salt, iterations);
  return [SCHEME, iterations, toBase64(salt), toBase64(hash)].join('$');
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** False for a wrong secret, an empty hash (no PIN set) or a malformed hash — never throws. */
export async function verifySecret(secret: string, encoded: string): Promise<boolean> {
  const [scheme, iterationsText, saltText, hashText] = encoded.split('$');
  const iterations = Number(iterationsText);
  if (scheme !== SCHEME || !Number.isInteger(iterations) || iterations <= 0 || !saltText || !hashText) return false;
  try {
    const expected = fromBase64(hashText);
    const actual = await derive(secret, fromBase64(saltText), iterations);
    return constantTimeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** 8 random symbols (~1.1 × 10^12 combinations), shown to the owner once as `ABCD-EFGH`. */
export function generateRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(RECOVERY_LENGTH));
  const code = Array.from(bytes, (b) => RECOVERY_ALPHABET[b % RECOVERY_ALPHABET.length]).join('');
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Recovery codes are compared without dashes/spaces and case-insensitively. */
export const normalizeRecoveryCode = (code: string): string => code.toUpperCase().replace(/[^A-Z0-9]/g, '');
