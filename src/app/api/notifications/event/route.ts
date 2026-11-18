import { NextRequest, NextResponse } from 'next/server';
import { getPublicWorkspaceState } from '@/lib/store';
import {
  dispatchWorkspaceEvent,
  WorkspaceEventInput,
} from '@/lib/notificationDispatcher';
import { NotificationEventKind } from '@/types';

export const dynamic = 'force-dynamic';

const ALLOWED_EVENTS = new Set<NotificationEventKind>([
  'blocker',
  'pi_review',
  'public_request',
  'test',
]);

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<WorkspaceEventInput>;
    if (!body || !body.type || !ALLOWED_EVENTS.has(body.type) || !body.title?.trim()) {
      return NextResponse.json({ error: 'Invalid notification event payload' }, { status: 400 });
    }

    const { data: workspace } = await getPublicWorkspaceState();
    const requestOrigin = req.nextUrl.origin;

    const outcome = await dispatchWorkspaceEvent({
      workspace,
      event: {
        type: body.type,
        title: body.title.trim(),
        subtitle: body.subtitle?.trim(),
        body: body.body?.trim(),
        actorName: body.actorName?.trim(),
        targetName: body.targetName?.trim(),
        projectTag: body.projectTag?.trim(),
        deadline: body.deadline?.trim(),
        isPrivate: Boolean(body.isPrivate),
        appUrl: body.appUrl?.trim() || requestOrigin,
      },
    });

    return NextResponse.json({ ok: true, outcome });
  } catch (err) {
    console.error('Notification event dispatch error:', err);
    return NextResponse.json(
      { error: 'Failed to dispatch notification event' },
      { status: 500 }
    );
  }
}
