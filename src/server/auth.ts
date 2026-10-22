import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE = 'fn_studio_session';
const MAX_AGE_SECONDS = 60 * 60 * 8;
export type Session = { sid: string; exp: number };

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new ApiError(503, `El servidor requiere configurar ${name}.`);
  return value;
}

function sign(value: string): string {
  const secret=requiredEnv('SESSION_SECRET');
  if(Buffer.byteLength(secret,'utf8')<32)throw new ApiError(503,'SESSION_SECRET debe tener al menos 32 caracteres aleatorios.');
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function issueSession(): { token: string; session: Session } {
  const session = { sid: randomUUID(), exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return { token: `${payload}.${sign(payload)}`, session };
}

function readCookie(req: VercelRequest): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  const item = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`));
  return item?.slice(COOKIE.length + 1);
}

export function getSession(req: VercelRequest): Session | null {
  const token = readCookie(req);
  if (!token) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  let actual: Buffer;
  let expected: Buffer;
  try { actual = Buffer.from(signature, 'base64url'); expected = Buffer.from(sign(payload), 'base64url'); }
  catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session;
    if (!session || !/^[0-9a-f-]{36}$/i.test(session.sid) || !Number.isInteger(session.exp) || session.exp <= Date.now() / 1000) return null;
    return session;
  } catch { return null; }
}

export function requireSession(req: VercelRequest): Session {
  const session = getSession(req);
  if (!session) throw new ApiError(401, 'Inicia sesión para continuar.');
  return session;
}

export function setSessionCookie(res: VercelResponse, token: string): void {
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`);
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

export function setPrivateResponseHeaders(res:VercelResponse):void{
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('Vary','Cookie');
  res.setHeader('X-Content-Type-Options','nosniff');
}

export function assertSameOrigin(req: VercelRequest): void {
  const origin = req.headers.origin;
  if (!origin) return;
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  try {
    if (!host || new URL(origin).host !== host) throw new Error('origin mismatch');
  } catch { throw new ApiError(403, 'Origen de solicitud no permitido.'); }
}

export function jsonError(res: VercelResponse, error: unknown): void {
  setPrivateResponseHeaders(res);
  const status = error instanceof ApiError ? error.status : 500;
  const message = error instanceof Error ? error.message : 'Error inesperado.';
  if (status === 429) res.setHeader('Retry-After', '3600');
  res.status(status).json({ error: message });
}
