import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

// 從 session cookie 讀取當前登入用戶的基本資訊（role 等）
// Sidebar 用此端點判斷是否顯示 admin 區塊
export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get('session_id')?.value;
  if (!sessionId) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = getSessionUser(sessionId);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      role: user.role,
    },
  });
}
