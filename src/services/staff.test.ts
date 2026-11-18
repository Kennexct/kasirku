import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { localDb } from '../db/localDb';
import { ensureLocalStore } from './bootstrap';
import { addCashier, deactivateCashier, getOwner, resetCashierPin, resetOwnerPinWithRecovery, setOwnerPin, verifyMemberPin } from './staff';

async function storeWithOwnerPin(pin = '1234') {
  const { store, owner } = await ensureLocalStore();
  const { recoveryCode } = await setOwnerPin(store.id, pin);
  if (!recoveryCode) throw new Error('expected a recovery code on first set');
  return { storeId: store.id, ownerId: owner.id, recoveryCode };
}

beforeEach(async () => {
  await localDb.delete();
  await localDb.open();
});

describe('owner PIN', () => {
  it('is stored hashed, returns a recovery code once, and needs the current PIN to change', async () => {
    const { storeId, ownerId, recoveryCode } = await storeWithOwnerPin();
    const owner = await getOwner(storeId);
    expect(owner.pinHash.startsWith('pbkdf2-sha256$')).toBe(true);
    expect(JSON.stringify(owner)).not.toContain('1234');
    expect(JSON.stringify(owner)).not.toContain(recoveryCode.replace('-', ''));

    await expect(setOwnerPin(storeId, '4321')).rejects.toThrow(/PIN saat ini salah/);
    expect(await setOwnerPin(storeId, '4321', '1234')).toEqual({ recoveryCode: null });
    expect(await verifyMemberPin(ownerId, '4321')).toEqual({ ok: true });
    await expect(setOwnerPin(storeId, '12')).rejects.toThrow(/4–6 angka/);
  });

  it('resets with the recovery code, rotates the code, and rejects the old one', async () => {
    const { storeId, ownerId, recoveryCode } = await storeWithOwnerPin();
    await expect(resetOwnerPinWithRecovery(storeId, 'AAAA-AAAA', '9999')).rejects.toThrow(/Kode pemulihan salah/);

    const next = await resetOwnerPinWithRecovery(storeId, recoveryCode.toLowerCase(), '9999');
    expect(next.recoveryCode).not.toBe(recoveryCode);
    expect(await verifyMemberPin(ownerId, '9999')).toEqual({ ok: true });
    await expect(resetOwnerPinWithRecovery(storeId, recoveryCode, '1111')).rejects.toThrow(/salah/);
  });
});

describe('verifyMemberPin lockout', () => {
  it('locks after 5 wrong PINs, refuses even the right PIN while locked, and recovers afterwards', async () => {
    const { ownerId } = await storeWithOwnerPin();
    const t0 = 1_000_000;
    for (let i = 1; i <= 4; i += 1) {
      expect(await verifyMemberPin(ownerId, '0000', t0)).toMatchObject({ ok: false, lockedMs: 0, error: `PIN salah. Sisa ${5 - i} percobaan.` });
    }
    expect(await verifyMemberPin(ownerId, '0000', t0)).toMatchObject({ ok: false, lockedMs: 30_000 });
    expect(await verifyMemberPin(ownerId, '1234', t0 + 10_000)).toMatchObject({ ok: false, lockedMs: 20_000 });
    expect(await localDb.auditEvents.filter((e) => e.action === 'pin_locked').count()).toBe(1);

    expect(await verifyMemberPin(ownerId, '1234', t0 + 30_001)).toEqual({ ok: true });
    expect(await verifyMemberPin(ownerId, '0000', t0 + 40_000)).toMatchObject({ lockedMs: 0, error: 'PIN salah. Sisa 4 percobaan.' });
  });
});

describe('cashiers', () => {
  it('cannot be added before the owner has a PIN', async () => {
    const { store } = await ensureLocalStore();
    await expect(addCashier(store.id, 'Dika', '5678')).rejects.toThrow(/PIN pemilik dulu/);
  });

  it('validates name, PIN and uniqueness; supports reset and deactivate', async () => {
    const { storeId } = await storeWithOwnerPin();
    await expect(addCashier(storeId, ' ', '5678')).rejects.toThrow(/wajib/);
    await expect(addCashier(storeId, 'Dika', '1234')).rejects.toThrow(/tidak boleh sama/);

    const dika = await addCashier(storeId, ' Dika ', '5678');
    expect(dika).toMatchObject({ role: 'cashier', displayName: 'Dika' });
    await expect(addCashier(storeId, 'dika', '8765')).rejects.toThrow(/sudah dipakai/);
    expect(await verifyMemberPin(dika.id, '5678')).toEqual({ ok: true });

    await resetCashierPin(dika.id, '2468');
    expect(await verifyMemberPin(dika.id, '5678')).toMatchObject({ ok: false });
    expect(await verifyMemberPin(dika.id, '2468')).toEqual({ ok: true });

    await deactivateCashier(dika.id);
    expect(await verifyMemberPin(dika.id, '2468')).toMatchObject({ ok: false, error: 'Akun tidak ditemukan.' });
    expect((await localDb.storeMembers.get(dika.id))?.displayName).toBe('Dika'); // kept for history
    const owner = await getOwner(storeId);
    await expect(deactivateCashier(owner.id)).rejects.toThrow(/hanya untuk akun kasir/);
  });
});
