import { accountFromBearer, entitledUntil, planOf } from './auth';
import { randomToken } from './crypto';
import { isFailedStatus, isPaidStatus, validSignature } from './midtrans';
import { DAY_MS, PLANS, type ApiResponse, type Deps, type Payment, type Plan } from './types';

const bad = (error: string, status = 400): ApiResponse => ({ status, body: { error } });
const isPlan = (v: unknown): v is Plan => v === 'monthly' || v === 'yearly';

const view = (p: Payment) => ({ orderId: p.orderId, plan: p.plan, amount: p.amount, status: p.status, createdAt: p.createdAt, paidAt: p.paidAt, method: p.method });

export async function checkout(deps: Deps, auth: string | null, body: unknown): Promise<ApiResponse> {
  const a = await accountFromBearer(deps, auth);
  if (!a) return bad('signed_out', 401);
  const plan = (body as { plan?: unknown })?.plan;
  if (!isPlan(plan)) return bad('invalid_plan');
  const { amount, label } = PLANS[plan];
  const now = deps.now();
  const orderId = `KK-${plan === 'monthly' ? 'M' : 'Y'}-${now.toString(36)}-${randomToken(4)}`.toUpperCase();
  await deps.repo.createPayment({ orderId, accountId: a.id, plan, amount, status: 'pending', createdAt: now, paidAt: null, method: null });
  const snap = await deps.midtrans.createSnap({ orderId, amount, itemName: label, email: a.email, finishUrl: `${deps.appOrigin}/app/pengaturan?tab=subscription&bayar=${encodeURIComponent(orderId)}` });
  return { status: 200, body: { orderId, redirectUrl: snap.redirectUrl } };
}

/** Applies a confirmed payment once. Extends from the later of now, the paid-until date and the trial end. */
async function applyPaid(deps: Deps, p: Payment, method: string | null): Promise<void> {
  const now = deps.now();
  if (!(await deps.repo.markPaymentPaid(p.orderId, now, method))) return; // already applied
  const a = await deps.repo.findAccountById(p.accountId);
  if (!a) return;
  const from = Math.max(now, a.paidUntil ?? 0, a.trialEndsAt);
  await deps.repo.setPaidUntil(a.id, from + PLANS[p.plan].days * DAY_MS);
}

/** Midtrans HTTP notification. Always answers 200 for well-formed, verified notifications so Midtrans stops retrying. */
export async function notification(deps: Deps, body: unknown): Promise<ApiResponse> {
  const n = (body ?? {}) as Record<string, unknown>;
  if (!(await validSignature(n, deps.midtrans.serverKey))) return bad('bad_signature', 403);
  const p = await deps.repo.findPayment(n.order_id as string);
  if (!p) return { status: 200, body: { ok: true, ignored: 'unknown_order' } };
  if (Math.round(Number(n.gross_amount)) !== p.amount) return bad('amount_mismatch', 400);
  const status = String(n.transaction_status ?? '');
  const fraud = typeof n.fraud_status === 'string' ? n.fraud_status : null;
  if (isPaidStatus(status, fraud)) await applyPaid(deps, p, typeof n.payment_type === 'string' ? n.payment_type : null);
  else if (p.status === 'pending' && isFailedStatus(status)) await deps.repo.setPaymentStatus(p.orderId, 'failed');
  else if (p.status === 'pending' && status === 'expire') await deps.repo.setPaymentStatus(p.orderId, 'expired');
  return { status: 200, body: { ok: true } };
}

/** Called by the app when it returns from Snap: asks Midtrans directly in case the notification is late. */
export async function paymentStatus(deps: Deps, auth: string | null, orderId: string): Promise<ApiResponse> {
  const a = await accountFromBearer(deps, auth);
  if (!a) return bad('signed_out', 401);
  const p = await deps.repo.findPayment(orderId);
  if (!p || p.accountId !== a.id) return bad('not_found', 404);
  if (p.status === 'pending') {
    const s = await deps.midtrans.getStatus(orderId);
    if (s && s.grossAmount === p.amount && isPaidStatus(s.transactionStatus, s.fraudStatus)) await applyPaid(deps, p, s.paymentType);
  }
  const fresh = (await deps.repo.findPayment(orderId))!;
  return { status: 200, body: view(fresh) };
}

export async function overview(deps: Deps, auth: string | null): Promise<ApiResponse> {
  const a = await accountFromBearer(deps, auth);
  if (!a) return bad('signed_out', 401);
  const payments = (await deps.repo.listPayments(a.id)).map(view);
  return {
    status: 200,
    body: {
      account: { email: a.email, plan: planOf(a), until: entitledUntil(a), trialEndsAt: a.trialEndsAt, paidUntil: a.paidUntil },
      prices: Object.fromEntries(Object.entries(PLANS).map(([k, v]) => [k, { amount: v.amount, days: v.days }])),
      payments,
    },
  };
}
