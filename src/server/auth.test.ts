import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  generateSalt,
  createSession,
  getSession,
  deleteSession,
  sanitizeUser,
  ServerUser,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from './auth';

test('hashPassword generates consistent hash with salt and rejects mismatched passwords', () => {
  const salt = generateSalt();
  const hash1 = hashPassword('MySecretPass@123', salt);
  const hash2 = hashPassword('MySecretPass@123', salt);
  const hashOther = hashPassword('WrongPassword', salt);

  assert.equal(hash1, hash2);
  assert.notEqual(hash1, hashOther);
  assert.equal(typeof hash1, 'string');
  assert.equal(hash1.length, 128); // 64 bytes in hex
});

test('session creation and retrieval with cryptographic tokens', () => {
  const userId = 'user_test_99';
  const { sessionId, session } = createSession(userId);

  assert.ok(sessionId);
  assert.equal(sessionId.length, 64); // 32 bytes in hex
  assert.equal(session.userId, userId);

  const retrieved = getSession(sessionId);
  assert.ok(retrieved);
  assert.equal(retrieved?.userId, userId);

  deleteSession(sessionId);
  assert.equal(getSession(sessionId), null);
});

test('sanitizeUser strips passwordHash and salt', () => {
  const rawUser: ServerUser = {
    id: 'user_safe',
    name: 'أحمد',
    email: 'ahmed@test.com',
    role: 'user',
    isAdmin: false,
    coins: 50,
    vipLevel: 'free',
    salt: 'fakesalt123',
    passwordHash: 'fakehash456',
    createdAt: '2026-01-01',
  };

  const safe = sanitizeUser(rawUser);
  assert.equal((safe as Record<string, unknown>).passwordHash, undefined);
  assert.equal((safe as Record<string, unknown>).salt, undefined);
  assert.equal(safe.email, 'ahmed@test.com');
  assert.equal(safe.isAdmin, false);
});

test('SESSION_COOKIE_OPTIONS enforces HttpOnly, Secure, and SameSite=Strict', () => {
  assert.equal(SESSION_COOKIE_NAME, 'shortdrama_session');
  assert.equal(SESSION_COOKIE_OPTIONS.httpOnly, true, 'Cookie must have httpOnly=true');
  assert.equal(SESSION_COOKIE_OPTIONS.secure, true, 'Cookie must have secure=true');
  assert.equal(SESSION_COOKIE_OPTIONS.sameSite, 'strict', 'Cookie must have sameSite=strict');
  assert.equal(SESSION_COOKIE_OPTIONS.path, '/', 'Cookie path must be root');
  assert.equal(SESSION_COOKIE_OPTIONS.maxAge, 7 * 24 * 60 * 60 * 1000, 'Cookie maxAge must be 7 days');
});
