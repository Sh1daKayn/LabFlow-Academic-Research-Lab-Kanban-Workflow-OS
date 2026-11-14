import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { NextRequest } from 'next/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GET, PUT } from '@/app/api/labflow/route';
import { classifyStoreError } from '@/lib/store';

describe('/api/labflow Route Persistence & Error Classification', () => {
  let tempDir = '';
  const prevDataDir = process.env.LABFLOW_DATA_DIR;
  const prevDatabaseUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'labflow-route-test-'));
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

  it('persists PUT workspace updates to disk and returns them on subsequent GET', async () => {
    const getInitialReq = new NextRequest('http://localhost:3000/api/labflow', { method: 'GET' });
    const initialRes = await GET(getInitialReq);
    expect(initialRes.status).toBe(200);
    const initialPayload = (await initialRes.json()) as {
      data: { tasks: Array<{ id: string; title: string }> };
      revision: number;
      storageMode: string;
    };

    expect(initialPayload.storageMode).toBe('local-file');
    expect(initialPayload.revision).toBe(1);
    const firstTask = initialPayload.data.tasks[0];
    expect(firstTask).toBeDefined();

    const updatedTasks = initialPayload.data.tasks.map((task, idx) =>
      idx === 0 ? { ...task, title: 'Updated Server-Persisted Task' } : task
    );

    const putReq = new NextRequest('http://localhost:3000/api/labflow', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: { ...initialPayload.data, tasks: updatedTasks },
        expectedRevision: initialPayload.revision,
      }),
    });
    const putRes = await PUT(putReq);
    expect(putRes.status).toBe(200);
    const putPayload = (await putRes.json()) as { revision: number };
    expect(putPayload.revision).toBe(2);

    // Subsequent GET must read the saved change back from the server store file
    const getAfterRes = await GET(
      new NextRequest('http://localhost:3000/api/labflow', { method: 'GET' })
    );
    expect(getAfterRes.status).toBe(200);
    const afterPayload = (await getAfterRes.json()) as {
      data: { tasks: Array<{ title: string }> };
      revision: number;
    };
    expect(afterPayload.revision).toBe(2);
    expect(afterPayload.data.tasks[0]?.title).toBe('Updated Server-Persisted Task');
  });

  it('returns 409 on stale revision and 403 when requireAdmin lacks valid cookie', async () => {
    const stalePutRes = await PUT(
      new NextRequest('http://localhost:3000/api/labflow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { tasks: [] },
          expectedRevision: 1,
        }),
      })
    );
    expect(stalePutRes.status).toBe(409);

    const forbiddenPutRes = await PUT(
      new NextRequest('http://localhost:3000/api/labflow', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { tasks: [] },
          requireAdmin: true,
        }),
      })
    );
    expect(forbiddenPutRes.status).toBe(403);
  });

  it('classifies filesystem read-only and database connectivity errors cleanly', () => {
    expect(classifyStoreError({ code: 'EROFS' })).toBe('READONLY_FILESYSTEM');
    expect(classifyStoreError({ code: 'EACCES' })).toBe('READONLY_FILESYSTEM');
    expect(classifyStoreError({ code: 'P1001' })).toBe('DATABASE_UNAVAILABLE');
    expect(
      classifyStoreError({
        name: 'PrismaClientInitializationError',
        message: "Can't reach database server at localhost:5432",
      })
    ).toBe('DATABASE_UNAVAILABLE');
    expect(classifyStoreError(new Error('unexpected failure'))).toBe('STORE_WRITE_FAILED');
  });
});
