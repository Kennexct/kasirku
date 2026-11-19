import { neon } from '@neondatabase/serverless';
import type { Account, LoginCode, Payment, RefreshToken, Repo } from './types';

type Row = Record<string, unknown>;
const ms = (v: unknown) => (v === null || v === undefined ? null : new Date(v as string).getTime());
const iso = (v: number | null) => (v === null ? null : new Date(v).toISOString());

const account = (r: Row): Account => ({
  id: r.id as string,
  email: r.email as string,
  googleSub: (r.google_sub as string | null) ?? null,
  createdAt: ms(r.created_at)!,
  trialEndsAt: ms(r.trial_ends_at)!,
  paidUntil: ms(r.paid_until),
});
const payment = (r: Row): Payment => ({
  orderId: r.order_id as string,
  accountId: r.account_id as string,
  plan: r.plan as Payment['plan'],
  amount: Number(r.amount),
  status: r.status as Payment['status'],
  createdAt: ms(r.created_at)!,
  paidAt: ms(r.paid_at),
  method: (r.method as string | null) ?? null,
});

export function neonRepo(databaseUrl: string): Repo {
  const sql = neon(databaseUrl);
  const one = async <T>(rows: Promise<Row[]>, map: (r: Row) => T) => {
    const [r] = await rows;
    return r ? map(r) : null;
  };
  return {
    findAccountByEmail: (email) => one(sql`select * from accounts where email = ${email}` as Promise<Row[]>, account),
    findAccountById: (id) => one(sql`select * from accounts where id = ${id}` as Promise<Row[]>, account),
    async createAccount(a) {
      await sql`insert into accounts (id, email, google_sub, created_at, trial_ends_at, paid_until)
        values (${a.id}, ${a.email}, ${a.googleSub}, ${iso(a.createdAt)}, ${iso(a.trialEndsAt)}, ${iso(a.paidUntil)})
        on conflict (email) do nothing`;
    },
    async setGoogleSub(id, sub) {
      await sql`update accounts set google_sub = ${sub} where id = ${id} and google_sub is null`;
    },
    async setPaidUntil(id, until) {
      await sql`update accounts set paid_until = ${iso(until)} where id = ${id}`;
    },
    getLoginCode: (email) =>
      one(sql`select * from login_codes where email = ${email}` as Promise<Row[]>, (r): LoginCode => ({
        email: r.email as string,
        codeHash: r.code_hash as string,
        expiresAt: ms(r.expires_at)!,
        attempts: Number(r.attempts),
        sentAt: ms(r.sent_at)!,
      })),
    async putLoginCode(c) {
      await sql`insert into login_codes (email, code_hash, expires_at, attempts, sent_at)
        values (${c.email}, ${c.codeHash}, ${iso(c.expiresAt)}, 0, ${iso(c.sentAt)})
        on conflict (email) do update set code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, sent_at = excluded.sent_at`;
    },
    async bumpLoginAttempts(email) {
      await sql`update login_codes set attempts = attempts + 1 where email = ${email}`;
    },
    async deleteLoginCode(email) {
      await sql`delete from login_codes where email = ${email}`;
    },
    async putRefreshToken(t) {
      await sql`insert into refresh_tokens (token_hash, account_id, expires_at) values (${t.tokenHash}, ${t.accountId}, ${iso(t.expiresAt)})`;
    },
    findRefreshToken: (h) =>
      one(sql`select * from refresh_tokens where token_hash = ${h}` as Promise<Row[]>, (r): RefreshToken => ({ tokenHash: r.token_hash as string, accountId: r.account_id as string, expiresAt: ms(r.expires_at)! })),
    takeRefreshToken: (h) =>
      one(sql`delete from refresh_tokens where token_hash = ${h} returning *` as Promise<Row[]>, (r): RefreshToken => ({ tokenHash: r.token_hash as string, accountId: r.account_id as string, expiresAt: ms(r.expires_at)! })),
    async deleteRefreshTokens(accountId) {
      await sql`delete from refresh_tokens where account_id = ${accountId}`;
    },
    async createPayment(p) {
      await sql`insert into payments (order_id, account_id, plan, amount, status, created_at)
        values (${p.orderId}, ${p.accountId}, ${p.plan}, ${p.amount}, ${p.status}, ${iso(p.createdAt)})`;
    },
    findPayment: (id) => one(sql`select * from payments where order_id = ${id}` as Promise<Row[]>, payment),
    async markPaymentPaid(id, paidAt, method) {
      const rows = (await sql`update payments set status = 'paid', paid_at = ${iso(paidAt)}, method = ${method}
        where order_id = ${id} and status <> 'paid' returning order_id`) as Row[];
      return rows.length === 1;
    },
    async setPaymentStatus(id, status) {
      await sql`update payments set status = ${status} where order_id = ${id} and status = 'pending'`;
    },
    async listPayments(accountId) {
      const rows = (await sql`select * from payments where account_id = ${accountId} order by created_at desc limit 50`) as Row[];
      return rows.map(payment);
    },
  };
}
