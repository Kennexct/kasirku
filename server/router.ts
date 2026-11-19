import { googleSignIn, refresh, requestCode, signOut, verifyCode } from './auth';
import { checkout, notification, overview, paymentStatus } from './billing';
import type { ApiResponse, Deps } from './types';

const MAX_BODY = 16_384;

export async function route(deps: Deps, method: string, path: string, auth: string | null, rawBody: string): Promise<ApiResponse> {
  if (rawBody.length > MAX_BODY) return { status: 413, body: { error: 'too_large' } };
  let body: unknown = null;
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      return { status: 400, body: { error: 'invalid_json' } };
    }
  }
  const key = `${method} ${path}`;
  switch (key) {
    case 'POST /api/auth/code':
      return requestCode(deps, body);
    case 'POST /api/auth/verify':
      return verifyCode(deps, body);
    case 'POST /api/auth/google':
      return googleSignIn(deps, body);
    case 'POST /api/auth/refresh':
      return refresh(deps, body);
    case 'POST /api/auth/signout':
      return signOut(deps, body);
    case 'GET /api/billing':
      return overview(deps, auth);
    case 'POST /api/billing/checkout':
      return checkout(deps, auth, body);
    case 'POST /api/billing/midtrans':
      return notification(deps, body);
  }
  const m = /^GET \/api\/billing\/status\/([A-Z0-9-]{6,64})$/.exec(key);
  if (m) return paymentStatus(deps, auth, m[1]);
  return { status: 404, body: { error: 'not_found' } };
}
