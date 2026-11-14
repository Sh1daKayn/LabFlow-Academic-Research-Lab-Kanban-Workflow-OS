import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/auth';
import {
  classifyStoreError,
  getPublicWorkspaceState,
  isAdminSessionValid,
  saveWorkspaceData,
} from '@/lib/store';
import { LabWorkspaceData } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const state = await getPublicWorkspaceState();
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isAdminUnlocked = await isAdminSessionValid(token);

    return NextResponse.json({
      ...state,
      isAdminUnlocked,
    });
  } catch (err) {
    console.error('Failed to load LabFlow workspace:', err);
    return NextResponse.json(
      { error: 'Failed to load workspace state' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      data?: Partial<LabWorkspaceData>;
      expectedRevision?: number;
      requireAdmin?: boolean;
    };

    if (!body || !body.data || typeof body.data !== 'object') {
      return NextResponse.json({ error: 'Invalid workspace payload' }, { status: 400 });
    }

    if (body.requireAdmin) {
      const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
      const isValid = await isAdminSessionValid(token);
      if (!isValid) {
        return NextResponse.json({ error: 'Admin authorization required' }, { status: 403 });
      }
    }

    const result = await saveWorkspaceData(body.data, body.expectedRevision);
    if (result.conflict) {
      return NextResponse.json(
        {
          error: 'Workspace has newer changes from another session',
          ...result,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Failed to save LabFlow workspace:', err);
    const code = classifyStoreError(err);
    const status = code === 'READONLY_FILESYSTEM' || code === 'DATABASE_UNAVAILABLE' ? 503 : 500;
    const message =
      code === 'READONLY_FILESYSTEM'
        ? 'Server filesystem is read-only; configure DATABASE_URL (PostgreSQL) for persistent server saves'
        : code === 'DATABASE_UNAVAILABLE'
        ? 'PostgreSQL database is unreachable; check DATABASE_URL and ensure the database is running'
        : 'Failed to save workspace state';
    return NextResponse.json({ error: message, code }, { status });
  }
}
