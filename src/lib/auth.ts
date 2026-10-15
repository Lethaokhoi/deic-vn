import type { CfEnv } from './cloudflare';

export const CLUB_EMAIL = 'clb@deic.vn';
export const CLUB_ACCOUNT_NAME = 'Ban biên tập CLB';

export function clubPassword(env: CfEnv): string | null {
  if (env.CLUB_PASSWORD) return env.CLUB_PASSWORD;
  if (import.meta.env.DEV) return 'Deic@DoLuong2026';
  return null;
}

const DEV_SECRET = 'deic-local-dev-secret-not-for-production';
const PBKDF2_ITERATIONS = 12000;

export function sessionSecret(env: CfEnv): string | null {
  if (env.SESSION_SECRET) return env.SESSION_SECRET;
  if (import.meta.env.DEV) return DEV_SECRET;
  return null;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await derive(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${hex(salt)}$${hex(new Uint8Array(bits))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, rounds, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'pbkdf2' || !rounds || !saltHex || !hashHex) return false;
  const iterations = Number(rounds);
  if (!Number.isFinite(iterations) || iterations < 1000 || iterations > 200000) return false;
  const bits = await derive(password, fromHex(saltHex), iterations);
  return safeEqual(hex(new Uint8Array(bits)), hashHex);
}

export async function createSession(userId: string, secret: string): Promise<string> {
  const exp = Date.now() + 14 * 24 * 60 * 60 * 1000;
  const payload = `${userId}.${exp}`;
  const sig = await sign(payload, secret);
  return `${payload}.${sig}`;
}

export async function readSession(token: string | undefined, secret: string | null): Promise<string | null> {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, exp, sig] = parts;
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return null;
  if (Number(exp) < Date.now()) return null;
  const expected = await sign(`${userId}.${exp}`, secret);
  if (!safeEqual(expected, sig)) return null;
  return userId;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' },
    key,
    256,
  );
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return base64url(sig);
}

function base64url(bytes: ArrayBuffer): string {
  let text = '';
  for (const byte of new Uint8Array(bytes)) text += String.fromCharCode(byte);
  return btoa(text).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function fromHex(value: string): Uint8Array {
  const out = new Uint8Array(value.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
