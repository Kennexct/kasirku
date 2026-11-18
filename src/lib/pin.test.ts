import { describe, expect, it } from 'vitest';
import { OWNER_UNLOCK_MS } from '../constants';
import { attemptsLeft, formatWait, lockRemainingMs, NO_LOCKOUT, registerFailure } from './lockout';
import { approverOf, requiresOwnerPin, type OwnerAccess } from './permissions';
import { generateRecoveryCode, hashSecret, isValidPin, normalizeRecoveryCode, verifySecret } from './pin';

const FAST = 1_000; // iterations for tests; production uses PIN_PBKDF2_ITERATIONS

describe('pin', () => {
  it('accepts only 4–6 digits', () => {
    expect(['1234', '123456'].every(isValidPin)).toBe(true);
    expect(['123', '1234567', '12a4', '', ' 1234'].some(isValidPin)).toBe(false);
  });

  it('hashes with a random salt and verifies only the right secret', async () => {
    const [a, b] = await Promise.all([hashSecret('1234', FAST), hashSecret('1234', FAST)]);
    expect(a).toMatch(/^pbkdf2-sha256\$1000\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
    expect(a).not.toBe(b);
    expect(a).not.toContain('1234');
    expect(await verifySecret('1234', a)).toBe(true);
    expect(await verifySecret('1235', a)).toBe(false);
  });

  it('never verifies against an empty or malformed hash', async () => {
    expect(await verifySecret('1234', '')).toBe(false);
    expect(await verifySecret('1234', 'bcrypt$10$abc$def')).toBe(false);
    expect(await verifySecret('1234', 'pbkdf2-sha256$x$!!$??')).toBe(false);
  });

  it('generates readable recovery codes and normalises input', () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    expect(normalizeRecoveryCode(' abcd-efgh ')).toBe('ABCDEFGH');
    expect(generateRecoveryCode()).not.toBe(code);
  });
});

describe('lockout', () => {
  it('allows 4 misses, locks 30 s on the 5th, then escalates and caps', () => {
    let state = NO_LOCKOUT;
    for (let i = 0; i < 4; i += 1) state = registerFailure(state, 0);
    expect(state.lockedUntil).toBeNull();
    expect(attemptsLeft(state)).toBe(1);

    const waits = [5, 6, 7, 8, 9].map(() => {
      state = registerFailure(state, 0);
      return lockRemainingMs(state, 0);
    });
    expect(waits).toEqual([30_000, 60_000, 300_000, 900_000, 900_000]);
    expect(lockRemainingMs(state, 900_000)).toBe(0);
    expect(formatWait(30_000)).toBe('30 detik');
    expect(formatWait(300_000)).toBe('5 menit');
  });
});

describe('requiresOwnerPin', () => {
  const now = 1_000_000;
  const cases: Array<[OwnerAccess, boolean]> = [
    [{ kind: 'open' }, false],
    [{ kind: 'unlocked', ownerId: 'o' }, false],
    [{ kind: 'approved', ownerId: 'o', grantedAt: now - 1_000 }, false],
    [{ kind: 'approved', ownerId: 'o', grantedAt: now - OWNER_UNLOCK_MS - 1 }, true],
    [{ kind: 'locked' }, true],
  ];

  it('treats owner_only and cashier_with_pin the same, and never gates the cashier level', () => {
    for (const [access, expected] of cases) {
      expect(requiresOwnerPin('cashier_with_pin', access, now)).toBe(expected);
      expect(requiresOwnerPin('owner_only', access, now)).toBe(expected);
      expect(requiresOwnerPin('cashier', access, now)).toBe(false);
    }
  });

  it('names the approver only when an owner was involved', () => {
    expect(approverOf({ kind: 'open' })).toBeNull();
    expect(approverOf({ kind: 'locked' })).toBeNull();
    expect(approverOf({ kind: 'approved', ownerId: 'o', grantedAt: now })).toBe('o');
  });
});
