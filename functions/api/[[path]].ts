/// <reference types="@cloudflare/workers-types" />
import { consoleMailer, resendMailer } from '../../server/mailer';
import { memoryRepo } from '../../server/memoryRepo';
import { devMidtrans, midtransClient } from '../../server/midtrans';
import { neonRepo } from '../../server/neonRepo';
import { googleVerifier, passSigner } from '../../server/pass';
import { route } from '../../server/router';
import type { Deps, PassSigner } from '../../server/types';

interface Env {
  DATABASE_URL?: string;
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  PASS_PRIVATE_JWK: string;
  MIDTRANS_SERVER_KEY: string;
  MIDTRANS_PRODUCTION?: string;
  GOOGLE_CLIENT_ID?: string;
  APP_ORIGIN: string;
  DEV_MODE?: string; // "1" only in `wrangler pages dev`: memory DB + console mail
}

let devRepo: ReturnType<typeof memoryRepo> | null = null;
let signerCache: { jwk: string; signer: PassSigner } | null = null;

async function deps(env: Env): Promise<Deps> {
  const dev = env.DEV_MODE === '1';
  if (!dev && (!env.DATABASE_URL || !env.RESEND_API_KEY || !env.MAIL_FROM)) throw new Error('missing_config');
  if (signerCache?.jwk !== env.PASS_PRIVATE_JWK) signerCache = { jwk: env.PASS_PRIVATE_JWK, signer: await passSigner(JSON.parse(env.PASS_PRIVATE_JWK)) };
  return {
    repo: env.DATABASE_URL ? neonRepo(env.DATABASE_URL) : (devRepo ??= memoryRepo()),
    mailer: env.RESEND_API_KEY && env.MAIL_FROM ? resendMailer(env.RESEND_API_KEY, env.MAIL_FROM) : consoleMailer,
    midtrans: dev && env.MIDTRANS_SERVER_KEY.startsWith('dev-') ? devMidtrans(env.MIDTRANS_SERVER_KEY, env.APP_ORIGIN) : midtransClient(env.MIDTRANS_SERVER_KEY, env.MIDTRANS_PRODUCTION === 'true'),
    signer: signerCache.signer,
    google: env.GOOGLE_CLIENT_ID ? googleVerifier(env.GOOGLE_CLIENT_ID) : null,
    now: Date.now,
    appOrigin: env.APP_ORIGIN.replace(/\/$/, ''),
  };
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  try {
    const raw = request.method === 'GET' ? '' : await request.text();
    const res = await route(await deps(env), request.method, url.pathname, request.headers.get('Authorization'), raw);
    return new Response(JSON.stringify(res.body), { status: res.status, headers });
  } catch (err) {
    console.error('api_error', url.pathname, err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500, headers });
  }
};
