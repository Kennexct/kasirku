import { MEMBER_NAME_MAX, PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '../constants';
import { localDb } from '../db/localDb';
import { nowIso } from '../lib/id';
import { attemptsLeft, formatWait, lockRemainingMs, NO_LOCKOUT, registerFailure, type LockoutState } from '../lib/lockout';
import { generateRecoveryCode, hashSecret, isValidPin, normalizeRecoveryCode, verifySecret } from '../lib/pin';
import type { Id, StoreMember } from '../types';
import { writeAudit } from './audit';
import { newMeta } from './catalog';
import { saveAndQueue } from './sync';
import { t } from '../i18n';

/** Staff, PINs and recovery (spec: .10x/specs/2026-11-18-staff-pin-design.md, ADR-003). */
export type PinCheck = { ok: true } | { ok: false; error: string; lockedMs: number };

const PIN_FORMAT_ERROR = t('PIN harus {0}–{1} angka.', PIN_MIN_LENGTH, PIN_MAX_LENGTH);
const lockKey = (scope: string) => `pinlock:${scope}`;
const lockedMessage = (ms: number) => t('Terlalu banyak percobaan. Coba lagi dalam {0}.', formatWait(ms));

async function readLock(scope: string): Promise<LockoutState> {
  const row = await localDb.meta.get(lockKey(scope));
  if (!row) return NO_LOCKOUT;
  try {
    const parsed = JSON.parse(row.value) as Partial<LockoutState>;
    return { failures: Number(parsed.failures) || 0, lockedUntil: typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : null };
  } catch {
    return NO_LOCKOUT;
  }
}

const writeLock = (scope: string, state: LockoutState) => localDb.meta.put({ key: lockKey(scope), value: JSON.stringify(state) });
const clearLock = (scope: string) => localDb.meta.delete(lockKey(scope));

/** Shared attempt-limited check for PINs and the recovery code. `scope` separates their counters. */
async function guardedVerify(member: StoreMember, scope: string, secret: string, encoded: string | undefined, wrongLabel: string, now: number): Promise<PinCheck> {
  const lock = await readLock(scope);
  const remaining = lockRemainingMs(lock, now);
  if (remaining > 0) return { ok: false, error: lockedMessage(remaining), lockedMs: remaining };

  if (encoded && (await verifySecret(secret, encoded))) {
    await clearLock(scope);
    return { ok: true };
  }

  const next = registerFailure(lock, now);
  await writeLock(scope, next);
  const lockedMs = lockRemainingMs(next, now);
  if (lockedMs > 0) {
    await writeAudit({ storeId: member.storeId, actorId: member.id, entity: 'member', entityId: member.id, action: 'pin_locked', payload: { scope, failures: next.failures } });
    return { ok: false, error: lockedMessage(lockedMs), lockedMs };
  }
  return { ok: false, error: t('{0} salah. Sisa {1} percobaan.', wrongLabel, attemptsLeft(next)), lockedMs: 0 };
}

async function activeMember(memberId: Id): Promise<StoreMember> {
  const member = await localDb.storeMembers.get(memberId);
  if (!member || member.deletedAt) throw new Error(t('Akun tidak ditemukan.'));
  return member;
}

export async function getOwner(storeId: Id): Promise<StoreMember> {
  const owner = await localDb.storeMembers.where('storeId').equals(storeId).filter((m) => m.role === 'owner' && !m.deletedAt).first();
  if (!owner) throw new Error(t('Data pemilik toko tidak ditemukan.'));
  return owner;
}

export async function verifyMemberPin(memberId: Id, pin: string, now: number = Date.now()): Promise<PinCheck> {
  const member = await localDb.storeMembers.get(memberId);
  if (!member || member.deletedAt) return { ok: false, error: t('Akun tidak ditemukan.'), lockedMs: 0 };
  return guardedVerify(member, member.id, pin, member.pinHash, 'PIN', now);
}

function requirePin(pin: string): void {
  if (!isValidPin(pin)) throw new Error(PIN_FORMAT_ERROR);
}

const save = (member: StoreMember) => saveAndQueue('storeMembers', { ...member, updatedAt: nowIso() });

/**
 * Sets or changes the owner PIN. Changing requires the current PIN.
 * Returns a recovery code the first time only — it is shown once and stored only as a hash.
 */
export async function setOwnerPin(storeId: Id, newPin: string, currentPin?: string): Promise<{ recoveryCode: string | null }> {
  requirePin(newPin);
  const owner = await getOwner(storeId);
  const isFirstTime = owner.pinHash === '';
  if (!isFirstTime) {
    const check = await verifyMemberPin(owner.id, currentPin ?? '');
    if (!check.ok) throw new Error(check.error.replace(/^PIN salah/, t('PIN saat ini salah')));
  }

  const recoveryCode = owner.recoveryHash ? null : generateRecoveryCode();
  await save({
    ...owner,
    pinHash: await hashSecret(newPin),
    recoveryHash: recoveryCode ? await hashSecret(normalizeRecoveryCode(recoveryCode)) : owner.recoveryHash,
  });
  await writeAudit({ storeId, actorId: owner.id, entity: 'member', entityId: owner.id, action: isFirstTime ? 'owner_pin_set' : 'owner_pin_changed' });
  return { recoveryCode };
}

/** Forgotten owner PIN: the recovery code sets a new PIN and is replaced by a fresh code. */
export async function resetOwnerPinWithRecovery(storeId: Id, code: string, newPin: string, now: number = Date.now()): Promise<{ recoveryCode: string }> {
  requirePin(newPin);
  const owner = await getOwner(storeId);
  const scope = `recovery:${owner.id}`;
  const check = await guardedVerify(owner, scope, normalizeRecoveryCode(code), owner.recoveryHash, t('Kode pemulihan'), now);
  if (!check.ok) throw new Error(check.error);

  const recoveryCode = generateRecoveryCode();
  await save({ ...owner, pinHash: await hashSecret(newPin), recoveryHash: await hashSecret(normalizeRecoveryCode(recoveryCode)) });
  await clearLock(owner.id);
  await writeAudit({ storeId, actorId: owner.id, entity: 'member', entityId: owner.id, action: 'owner_pin_recovered' });
  return { recoveryCode };
}

function cleanName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new Error(t('Nama kasir wajib diisi.'));
  if (trimmed.length > MEMBER_NAME_MAX) throw new Error(t('Nama maksimal {0} karakter.', MEMBER_NAME_MAX));
  return trimmed;
}

export async function addCashier(storeId: Id, name: string, pin: string): Promise<StoreMember> {
  const displayName = cleanName(name);
  requirePin(pin);
  const owner = await getOwner(storeId);
  if (owner.pinHash === '') throw new Error(t('Atur PIN pemilik dulu sebelum menambah kasir.'));
  if (await verifySecret(pin, owner.pinHash)) throw new Error(t('PIN kasir tidak boleh sama dengan PIN pemilik.'));

  const members = await localDb.storeMembers.where('storeId').equals(storeId).toArray();
  const isTaken = members.some((m) => !m.deletedAt && m.displayName.toLowerCase() === displayName.toLowerCase());
  if (isTaken) throw new Error(t('Nama "{0}" sudah dipakai.', displayName));

  const cashier: StoreMember = { ...newMeta(storeId), userId: null, role: 'cashier', displayName, pinHash: await hashSecret(pin) };
  await saveAndQueue('storeMembers', cashier);
  await writeAudit({ storeId, actorId: owner.id, entity: 'member', entityId: cashier.id, action: 'cashier_added', payload: { displayName } });
  return cashier;
}

async function cashierOnly(memberId: Id): Promise<StoreMember> {
  const member = await activeMember(memberId);
  if (member.role !== 'cashier') throw new Error(t('Tindakan ini hanya untuk akun kasir.'));
  return member;
}

export async function resetCashierPin(memberId: Id, pin: string): Promise<void> {
  requirePin(pin);
  const cashier = await cashierOnly(memberId);
  const owner = await getOwner(cashier.storeId);
  if (await verifySecret(pin, owner.pinHash)) throw new Error(t('PIN kasir tidak boleh sama dengan PIN pemilik.'));
  await save({ ...cashier, pinHash: await hashSecret(pin) });
  await clearLock(cashier.id);
  await writeAudit({ storeId: cashier.storeId, actorId: owner.id, entity: 'member', entityId: cashier.id, action: 'cashier_pin_reset' });
}

/** Soft delete: the cashier can no longer sign in but their name stays on past sales. */
export async function deactivateCashier(memberId: Id): Promise<void> {
  const cashier = await cashierOnly(memberId);
  const owner = await getOwner(cashier.storeId);
  await save({ ...cashier, deletedAt: nowIso() });
  await writeAudit({ storeId: cashier.storeId, actorId: owner.id, entity: 'member', entityId: cashier.id, action: 'cashier_deactivated', payload: { displayName: cashier.displayName } });
}
