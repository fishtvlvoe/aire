import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE } from '../listings/[id]/route';
import { deleteListing, getListing } from '@/lib/db';

// Mock NextResponse
// 參考既有測試檔的寫法：直接 mock NextResponse.json，回傳可被 assert 的物件。
vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, options?: { status?: number }) => ({
      data,
      // NextResponse.json 未指定 status 時，預設為 200。
      status: options?.status ?? 200,
    }),
  },
}));

// Mock DB
// 注意：route.ts 會同時 import deleteListing 與 getListing，所以 mock 需提供兩者。
vi.mock('@/lib/db', () => ({
  deleteListing: vi.fn(),
  getListing: vi.fn(),
}));

describe('DELETE /api/listings/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('既有 id 刪除成功回 200 + success:true', async () => {
    // 情境：資料存在且硬刪除成功
    vi.mocked(getListing).mockReturnValue({ id: 5 } as never);
    vi.mocked(deleteListing).mockReturnValue(true);

    const request = new Request('http://localhost/api/listings/5', {
      method: 'DELETE',
    });

    // 這個專案的 route handler context.params 被定義為 Promise
    const response = await DELETE(request, { params: Promise.resolve({ id: '5' }) });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(deleteListing).toHaveBeenCalledWith(5);
  });

  it('不存在的 id 回 404 + error:not found', async () => {
    // 情境：硬刪除回傳 false，代表找不到或無法刪除
    vi.mocked(deleteListing).mockReturnValue(false);

    const request = new Request('http://localhost/api/listings/999', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) });

    expect(response.status).toBe(404);
    expect(response.data.error).toBe('not found');
  });

  it('無效 id 字串回 400 + error:invalid id', async () => {
    // 情境：id 無法轉成數字時，應直接回 400，且不需要設定任何 DB mock 回傳值
    const request = new Request('http://localhost/api/listings/abc', {
      method: 'DELETE',
    });

    const response = await DELETE(request, { params: Promise.resolve({ id: 'abc' }) });

    expect(response.status).toBe(400);
    expect(response.data.error).toBe('invalid id');
  });
});
