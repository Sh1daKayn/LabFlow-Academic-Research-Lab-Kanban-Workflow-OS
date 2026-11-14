import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, DEFAULT_ADMIN_TTL_MS } from '@/lib/auth';
import {
  authenticateAdminPassword,
  changeAdminPassword,
  isAdminSessionValid,
} from '@/lib/store';

export const dynamic = 'force-dynamic';

function isSecureRequest(req: NextRequest): boolean {
  return (
    req.nextUrl.protocol === 'https:' ||
    req.headers.get('x-forwarded-proto') === 'https'
  );
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const unlocked = await isAdminSessionValid(token);
  return NextResponse.json({ unlocked });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { password?: string };
    const password = typeof body?.password === 'string' ? body.password : '';
    const auth = await authenticateAdminPassword(password);

    if (!auth.valid || !auth.token) {
      return NextResponse.json({ unlocked: false, error: 'Invalid password' }, { status: 401 });
    }

    const res = NextResponse.json({ unlocked: true });
    res.cookies.set(ADMIN_COOKIE_NAME, auth.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(DEFAULT_ADMIN_TTL_MS / 1000),
      secure: isSecureRequest(req),
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const unlocked = await isAdminSessionValid(token);
    if (!unlocked) {
      return NextResponse.json({ error: 'Admin session required' }, { status: 403 });
    }

    const body = (await req.json()) as { newPassword?: string };
    const nextPass = typeof body?.newPassword === 'string' ? body.newPassword.trim() : '';
    if (nextPass.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
        { status: 400 }
      );
    }

    await changeAdminPassword(nextPass);
    return NextResponse.json({ updated: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ unlocked: false });
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: isSecureRequest(req),
  });
  return res;
}
