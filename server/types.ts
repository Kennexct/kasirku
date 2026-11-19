export type Plan = 'monthly' | 'yearly';
export const PLANS: Record<Plan, { amount: number; days: number; label: string }> = {
  monthly: { amount: 49_000, days: 30, label: 'KasirKu Bulanan' },
  yearly: { amount: 490_000, days: 365, label: 'KasirKu Tahunan' },
};
export const TRIAL_DAYS = 14;
export const DAY_MS = 86_400_000;

export interface Account {
  id: string;
  email: string;
  googleSub: string | null;
  createdAt: number;
  trialEndsAt: number;
  paidUntil: number | null;
}

export interface LoginCode {
  email: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
  sentAt: number;
}

export interface RefreshToken {
  tokenHash: string;
  accountId: string;
  expiresAt: number;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';
export interface Payment {
  orderId: string;
  accountId: string;
  plan: Plan;
  amount: number;
  status: PaymentStatus;
  createdAt: number;
  paidAt: number | null;
  method: string | null;
}

export interface Repo {
  findAccountByEmail(email: string): Promise<Account | null>;
  findAccountById(id: string): Promise<Account | null>;
  createAccount(a: Account): Promise<void>;
  setGoogleSub(id: string, sub: string): Promise<void>;
  setPaidUntil(id: string, paidUntil: number): Promise<void>;

  getLoginCode(email: string): Promise<LoginCode | null>;
  putLoginCode(c: LoginCode): Promise<void>;
  bumpLoginAttempts(email: string): Promise<void>;
  deleteLoginCode(email: string): Promise<void>;

  putRefreshToken(t: RefreshToken): Promise<void>;
  findRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
  takeRefreshToken(tokenHash: string): Promise<RefreshToken | null>; // read and delete (rotation)
  deleteRefreshTokens(accountId: string): Promise<void>;

  createPayment(p: Payment): Promise<void>;
  findPayment(orderId: string): Promise<Payment | null>;
  /** Moves a pending payment to paid exactly once; returns false when it was not pending. */
  markPaymentPaid(orderId: string, paidAt: number, method: string | null): Promise<boolean>;
  setPaymentStatus(orderId: string, status: PaymentStatus): Promise<void>;
  listPayments(accountId: string): Promise<Payment[]>;
}

export interface Mailer {
  sendLoginCode(email: string, code: string): Promise<void>;
}

export interface SnapResult {
  token: string;
  redirectUrl: string;
}
export interface MidtransStatus {
  transactionStatus: string;
  fraudStatus: string | null;
  grossAmount: number;
  paymentType: string | null;
}
export interface Midtrans {
  createSnap(input: { orderId: string; amount: number; itemName: string; email: string; finishUrl: string }): Promise<SnapResult>;
  getStatus(orderId: string): Promise<MidtransStatus | null>;
  serverKey: string;
}

export interface PassSigner {
  sign(claims: { sub: string; email: string; plan: 'trial' | 'paid'; until: number }): Promise<string>;
}

export interface GoogleVerifier {
  verify(idToken: string): Promise<{ sub: string; email: string } | null>;
}

export interface Deps {
  repo: Repo;
  mailer: Mailer;
  midtrans: Midtrans;
  signer: PassSigner;
  google: GoogleVerifier | null;
  now: () => number;
  appOrigin: string;
}

export interface ApiResponse {
  status: number;
  body: unknown;
}
