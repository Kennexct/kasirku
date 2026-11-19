// Generates the ES256 key pair for the access pass (ADR-013).
//   node scripts/gen-pass-key.mjs
// Put PRIVATE in Cloudflare as the secret PASS_PRIVATE_JWK and PUBLIC in the build env as VITE_PASS_PUBLIC_JWK.
import { exportJWK, generateKeyPair } from 'jose';

const kid = `k${new Date().toISOString().slice(0, 10).replaceAll('-', '')}`;
const { publicKey, privateKey } = await generateKeyPair('ES256', { extractable: true });
const pub = { ...(await exportJWK(publicKey)), kid, alg: 'ES256', use: 'sig' };
const priv = { ...(await exportJWK(privateKey)), kid, alg: 'ES256', use: 'sig' };
console.log(`PASS_PRIVATE_JWK='${JSON.stringify(priv)}'`);
console.log(`VITE_PASS_PUBLIC_JWK='${JSON.stringify(pub)}'`);
