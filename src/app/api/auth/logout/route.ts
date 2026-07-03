/**
 * POST /api/auth/logout
 *
 * Clears the admin session cookie.
 * Always returns 200 (idempotent — calling it when already logged out is safe).
 *
 * Response:
 *   200 { data: { success: true }, error: null }
 */
import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(): Promise<NextResponse> {
  const response = NextResponse.json(
    { data: { success: true }, error: null },
    { status: 200 }
  );

  // Expire the session cookie immediately
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
