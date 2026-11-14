import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  generateSessionSecret,
  hashPassword,
  signAdminToken,
  verifyAdminToken,
  verifyPassword,
} from '@/lib/auth';
import {
  authenticateAdminPassword,
  changeAdminPassword,
  getPublicWorkspaceState,
  isAdminSessionValid,
  saveWorkspaceData,
} from '@/lib/store';

describe('Crypto Auth & Local-File Workspace Store', () => {
  let tempDir = '';
  const prevDataDir = process.env.LABFLOW_DATA_DIR;
  const prevDatabaseUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'labflow-test-'));
    process.env.LABFLOW_DATA_DIR = tempDir;
    delete process.env.DATABASE_URL;
  });

  afterAll(async () => {
    if (prevDataDir !== undefined) {
      process.env.LABFLOW_DATA_DIR = prevDataDir;
    } else {
      delete process.env.LABFLOW_DATA_DIR;
    }

    if (prevDatabaseUrl !== undefined) {
      process.env.DATABASE_URL = prevDatabaseUrl;
    }

    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('hashes and verifies passwords with scrypt timing-safe equality', () => {
    const hashed = hashPassword('super-secret-pass');
    expect(hashed).toMatch(/^scrypt\$[a-f0-9]+\$[a-f0-9]+$/);
    expect(verifyPassword('super-secret-pass', hashed)).toBe(true);
    expect(verifyPassword('wrong-pass', hashed)).toBe(false);
    expect(verifyPassword('any', 'malformed-hash')).toBe(false);
  });

  it('signs, validates, and rejects expired/tampered HMAC admin session tokens', () => {
    const secret = generateSessionSecret();
    const validToken = signAdminToken(secret, Date.now() + 60_000);
    expect(verifyAdminToken(validToken, secret)).toBe(true);

    // Tampered signature
    const [payload] = validToken.split('.');
    expect(verifyAdminToken(`${payload}.tampered0000`, secret)).toBe(false);

    // Wrong secret
    expect(verifyAdminToken(validToken, generateSessionSecret())).toBe(false);

    // Expired token
    const expired = signAdminToken(secret, Date.now() - 1_000);
    expect(verifyAdminToken(expired, secret)).toBe(false);
  });

  it('persists workspace updates atomically with optimistic revision checking', async () => {
    const initial = await getPublicWorkspaceState();
    expect(initial.storageMode).toBe('local-file');
    expect(initial.revision).toBe(1);
    expect(initial.data.tasks.length).toBeGreaterThan(0);

    const updated = await saveWorkspaceData(
      {
        ...initial.data,
        tasks: initial.data.tasks.slice(0, 1),
      },
      initial.revision
    );

    expect(updated.conflict).toBe(false);
    expect(updated.revision).toBe(2);
    expect(updated.data.tasks.length).toBe(1);

    // Stale expectedRevision should cleanly report conflict without overwriting
    const staleAttempt = await saveWorkspaceData(
      {
        ...initial.data,
        tasks: [],
      },
      1
    );
    expect(staleAttempt.conflict).toBe(true);
    expect(staleAttempt.revision).toBe(2);
    expect(staleAttempt.data.tasks.length).toBe(1);
  });

  it('authenticates default password, rotates admin password, and invalidates old credentials', async () => {
    const badLogin = await authenticateAdminPassword('wrong-pass');
    expect(badLogin.valid).toBe(false);

    const defaultLogin = await authenticateAdminPassword('admin888');
    expect(defaultLogin.valid).toBe(true);
    expect(defaultLogin.token).toBeTruthy();
    expect(await isAdminSessionValid(defaultLogin.token)).toBe(true);

    await changeAdminPassword('newpass-2026');

    const oldAfterChange = await authenticateAdminPassword('admin888');
    expect(oldAfterChange.valid).toBe(false);

    const newLogin = await authenticateAdminPassword('newpass-2026');
    expect(newLogin.valid).toBe(true);
    expect(await isAdminSessionValid(newLogin.token)).toBe(true);
  });
});
