import crypto from 'crypto';

export const ADMIN_COOKIE_NAME = 'labflow_admin_session';
export const DEFAULT_ADMIN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('scrypt$')) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3) return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  const actualBuf = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

export function generateSessionSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function signAdminToken(secret: string, expiresAtMs = Date.now() + DEFAULT_ADMIN_TTL_MS): string {
  const payload = String(expiresAtMs);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `${payload}.${signature}`;
}

export function verifyAdminToken(token: string | undefined | null, secret: string): boolean {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sigHex] = parts;
  const expiresAtMs = Number(payload);
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return false;
  }
  const expectedSigHex = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const actualBuf = Buffer.from(sigHex, 'hex');
  const expectedBuf = Buffer.from(expectedSigHex, 'hex');
  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}
