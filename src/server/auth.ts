import crypto from 'crypto';

export interface ServerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'user' | 'creator';
  isAdmin: boolean;
  coins: number;
  vipLevel: 'free' | 'vip' | 'premium';
  passwordHash?: string;
  salt?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
}

// In-memory sessions store (persisted across requests)
const sessions = new Map<string, Session>();

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function createSession(userId: string): { sessionId: string; session: Session } {
  // Cryptographically secure 256-bit session token
  const sessionId = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const session: Session = {
    id: sessionId,
    userId,
    createdAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };
  sessions.set(sessionId, session);
  return { sessionId, session };
}

export function getSession(sessionId?: string): Session | null {
  if (!sessionId) return null;
  const session = sessions.get(sessionId);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return null;
  }

  return session;
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function sanitizeUser(user: ServerUser) {
  const { passwordHash, salt, ...safeUser } = user;
  return safeUser;
}

// Secure session cookie settings:
// - httpOnly: prevents client-side JavaScript access via document.cookie
// - secure: ensures transmission only over HTTPS connections (and localhost)
// - sameSite: 'strict' prevents sending the cookie in cross-site requests (protecting against CSRF)
export const SESSION_COOKIE_NAME = 'shortdrama_session';
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_DURATION_MS,
};
