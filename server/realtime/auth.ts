import crypto from 'node:crypto';

const key = () => Buffer.from(process.env.SESSION_SECRET!, 'hex');

export function signSocketToken(userId: number, ttlSec = 3600): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${userId}.${exp}`;
  const sig = crypto.createHmac('sha256', key()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifySocketToken(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userIdStr, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
  const expected = crypto
    .createHmac('sha256', key())
    .update(`${userIdStr}.${expStr}`)
    .digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const userId = Number(userIdStr);
  if (!Number.isFinite(userId)) return null;
  return userId;
}
