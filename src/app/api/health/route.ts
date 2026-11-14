import { NextResponse } from 'next/server';
import { getPublicWorkspaceState } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getPublicWorkspaceState();
    return NextResponse.json({
      ok: true,
      storageMode: state.storageMode,
      revision: state.revision,
      updatedAt: state.updatedAt,
    });
  } catch (err) {
    console.error('Health check failed:', err);
    return NextResponse.json({ ok: false, error: 'Database or store unavailable' }, { status: 500 });
  }
}
