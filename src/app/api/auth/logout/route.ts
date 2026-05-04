import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, deleteSession } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  const sessionId = req.cookies?.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    deleteSession(sessionId);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
