import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/auth';
import { getResolvedIntegrationSecrets } from '@/lib/integrationStore';
import { dispatchWorkspaceDigest } from '@/lib/notificationDispatcher';
import { getPublicWorkspaceState, isAdminSessionValid } from '@/lib/store';
import { buildWorkspaceDigestReport } from '@/utils/notificationPayloads';

export const dynamic = 'force-dynamic';

function timingSafeMatch(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function authorizeDigestTrigger(req: NextRequest): Promise<{
  authorized: boolean;
  reason?: string;
}> {
  const [tokenCookie, secrets] = [
    req.cookies.get(ADMIN_COOKIE_NAME)?.value,
    await getResolvedIntegrationSecrets(),
  ];

  const isAdmin = await isAdminSessionValid(tokenCookie);
  if (isAdmin) {
    return { authorized: true };
  }

  const authHeader = req.headers.get('authorization') || '';
  const bearer = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';
  const headerSecret = req.headers.get('x-cron-secret')?.trim() || '';
  const querySecret = req.nextUrl.searchParams.get('secret')?.trim() || '';
  const candidate = bearer || headerSecret || querySecret;

  if (secrets.cronSecret && timingSafeMatch(candidate, secrets.cronSecret)) {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: secrets.cronSecret
      ? 'Valid CRON_SECRET bearer token or unlocked Admin session required'
      : 'Unlocked Admin session required (or configure CRON_SECRET for automated cron triggers)',
  };
}

/**
 * Scheduled cron endpoint for Scheme D Weekly & 48h Deadline Digest.
 * Supports Vercel Cron / GitHub Actions / crontab via Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  try {
    const previewOnly = req.nextUrl.searchParams.get('preview') === '1';
    const [{ data: workspace }, secrets] = await Promise.all([
      getPublicWorkspaceState(),
      getResolvedIntegrationSecrets(),
    ]);

    if (previewOnly) {
      const report = buildWorkspaceDigestReport(workspace, {
        appUrl: secrets.appBaseUrl || req.nextUrl.origin,
        extraRecipients: secrets.digestEmailTo,
      });
      return NextResponse.json({ previewOnly: true, report });
    }

    const auth = await authorizeDigestTrigger(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason }, { status: 401 });
    }

    const { report, outcome } = await dispatchWorkspaceDigest({
      workspace,
      appUrlOverride: secrets.appBaseUrl || req.nextUrl.origin,
      secretsOverride: secrets,
    });

    return NextResponse.json({ ok: true, report, outcome });
  } catch (err) {
    console.error('Digest GET route error:', err);
    return NextResponse.json({ error: 'Failed to run scheduled digest' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { previewOnly?: boolean };
    const [{ data: workspace }, secrets] = await Promise.all([
      getPublicWorkspaceState(),
      getResolvedIntegrationSecrets(),
    ]);

    if (body?.previewOnly) {
      const report = buildWorkspaceDigestReport(workspace, {
        appUrl: secrets.appBaseUrl || req.nextUrl.origin,
        extraRecipients: secrets.digestEmailTo,
      });
      return NextResponse.json({ previewOnly: true, report });
    }

    const auth = await authorizeDigestTrigger(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.reason }, { status: 403 });
    }

    const { report, outcome } = await dispatchWorkspaceDigest({
      workspace,
      appUrlOverride: secrets.appBaseUrl || req.nextUrl.origin,
      secretsOverride: secrets,
    });

    return NextResponse.json({ ok: true, report, outcome });
  } catch (err) {
    console.error('Digest POST route error:', err);
    return NextResponse.json({ error: 'Failed to dispatch digest' }, { status: 500 });
  }
}
