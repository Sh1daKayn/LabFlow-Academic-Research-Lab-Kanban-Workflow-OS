import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/auth';
import { isAdminSessionValid } from '@/lib/store';
import {
  getMaskedIntegrationStatus,
  updateIntegrationSecrets,
} from '@/lib/integrationStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const [status, isAdminUnlocked] = await Promise.all([
      getMaskedIntegrationStatus(),
      isAdminSessionValid(token),
    ]);
    return NextResponse.json({ status, isAdminUnlocked });
  } catch (err) {
    console.error('Failed to read notification integration config:', err);
    return NextResponse.json(
      { error: 'Failed to load integration config' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isAdminUnlocked = await isAdminSessionValid(token);
    if (!isAdminUnlocked) {
      return NextResponse.json(
        { error: 'Admin unlock required to modify Webhook or SMTP secrets' },
        { status: 403 }
      );
    }

    const body = (await req.json()) as {
      teamsWebhookUrl?: string;
      slackWebhookUrl?: string;
      resendApiKey?: string;
      smtpHost?: string;
      smtpPort?: number;
      smtpSecure?: boolean;
      smtpUser?: string;
      smtpPass?: string;
      mailFrom?: string;
      digestEmailTo?: string;
      appBaseUrl?: string;
    };

    const result = await updateIntegrationSecrets(body || {});
    if (result.error) {
      return NextResponse.json(
        { error: result.error, status: result.status },
        { status: 400 }
      );
    }

    return NextResponse.json({ status: result.status, isAdminUnlocked: true });
  } catch (err) {
    console.error('Failed to save notification integration config:', err);
    return NextResponse.json(
      { error: 'Failed to save integration secrets' },
      { status: 500 }
    );
  }
}
