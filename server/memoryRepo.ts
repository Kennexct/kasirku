import type { Account, LoginCode, Payment, PaymentStatus, RefreshToken, Repo } from './types';

/** In-memory Repo for tests and `wrangler pages dev` without a database. */
export function memoryRepo(): Repo & { accounts: Map<string, Account>; payments: Map<string, Payment> } {
  const accounts = new Map<string, Account>();
  const codes = new Map<string, LoginCode>();
  const tokens = new Map<string, RefreshToken>();
  const payments = new Map<string, Payment>();
  const clone = <T>(v: T | undefined): T | null => (v ? structuredClone(v) : null);
  return {
    accounts,
    payments,
    async findAccountByEmail(email) {
      return clone([...accounts.values()].find((a) => a.email === email));
    },
    async findAccountById(id) {
      return clone(accounts.get(id));
    },
    async createAccount(a) {
      accounts.set(a.id, structuredClone(a));
    },
    async setGoogleSub(id, sub) {
      const a = accounts.get(id);
      if (a) a.googleSub = sub;
    },
    async setPaidUntil(id, paidUntil) {
      const a = accounts.get(id);
      if (a) a.paidUntil = paidUntil;
    },
    async getLoginCode(email) {
      return clone(codes.get(email));
    },
    async putLoginCode(c) {
      codes.set(c.email, structuredClone(c));
    },
    async bumpLoginAttempts(email) {
      const c = codes.get(email);
      if (c) c.attempts++;
    },
    async deleteLoginCode(email) {
      codes.delete(email);
    },
    async putRefreshToken(t) {
      tokens.set(t.tokenHash, structuredClone(t));
    },
    async findRefreshToken(h) {
      return clone(tokens.get(h));
    },
    async takeRefreshToken(h) {
      const t = tokens.get(h);
      tokens.delete(h);
      return clone(t);
    },
    async deleteRefreshTokens(accountId) {
      for (const [k, t] of tokens) if (t.accountId === accountId) tokens.delete(k);
    },
    async createPayment(p) {
      payments.set(p.orderId, structuredClone(p));
    },
    async findPayment(id) {
      return clone(payments.get(id));
    },
    async markPaymentPaid(id, paidAt, method) {
      const p = payments.get(id);
      if (!p || p.status === 'paid') return false;
      p.status = 'paid';
      p.paidAt = paidAt;
      p.method = method;
      return true;
    },
    async setPaymentStatus(id, status: PaymentStatus) {
      const p = payments.get(id);
      if (p) p.status = status;
    },
    async listPayments(accountId) {
      return [...payments.values()].filter((p) => p.accountId === accountId).sort((a, b) => b.createdAt - a.createdAt).map((p) => structuredClone(p));
    },
  };
}
