import { beforeEach, describe, expect, it, vi } from 'vitest';
import path from 'node:path';
import * as fs from 'node:fs';
import { POST } from '@/app/api/listings/[id]/photos/route';

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, options?: { status?: number }) => ({
      data,
      status: options?.status ?? 200,
    }),
  },
}));

vi.mock('node:fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe('POST /api/listings/[id]/photos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('multipart 上傳：MIME 過濾 + UUID 檔名 + 寫入正確目錄 + 回傳 filenames', async () => {
    const formData = new FormData();
    formData.append(
      'photos',
      new File([new Uint8Array([1, 2, 3])], 'photo1.png', { type: 'image/png' }),
    );
    formData.append(
      'photos',
      new File([new Uint8Array([4, 5, 6])], '../evil.jpg', { type: 'image/jpeg' }),
    );

    const request = new Request('http://localhost/api/listings/5/photos', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request, { params: Promise.resolve({ id: '5' }) });

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.filenames).toBeDefined();
    expect(Array.isArray(response.data.filenames)).toBe(true);
    expect(response.data.filenames).toHaveLength(2);

    const filenames = response.data.filenames as string[];
    expect(filenames.every((n) => typeof n === 'string')).toBe(true);

    // UUID 檔名，保留副檔名
    expect(filenames.some((n) => n.endsWith('.png'))).toBe(true);
    expect(filenames.some((n) => n.endsWith('.jpg'))).toBe(true);

    // 無 path traversal 片段
    expect(filenames.some((n) => n.includes('..'))).toBe(false);
    expect(filenames.some((n) => n.includes('/'))).toBe(false);

    // 兩個檔案都寫入 public/uploads/listings/5/
    const dir = path.join(process.cwd(), 'public/uploads/listings', '5');
    expect(vi.mocked(fs.promises.mkdir)).toHaveBeenCalledWith(dir, { recursive: true });
    expect(vi.mocked(fs.promises.writeFile)).toHaveBeenCalledTimes(2);

    const writePaths = vi
      .mocked(fs.promises.writeFile)
      .mock.calls.map((c) => String(c[0]));

    for (const name of filenames) {
      expect(writePaths).toContain(path.join(dir, name));
    }
    expect(writePaths.some((p) => p.includes('..'))).toBe(false);
  });

  it('拒絕非圖片 MIME（400）', async () => {
    const formData = new FormData();
    formData.append(
      'photos',
      new File([new Uint8Array([1, 2, 3])], 'payload.html', { type: 'text/html' }),
    );

    const request = new Request('http://localhost/api/listings/5/photos', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request, { params: Promise.resolve({ id: '5' }) });

    expect(response.status).toBe(400);
    expect(vi.mocked(fs.promises.writeFile)).not.toHaveBeenCalled();
  });

  it('拒絕超大檔（413）', async () => {
    const bigBuffer = new Uint8Array(11 * 1024 * 1024); // 11MB > 10MB 限制
    const formData = new FormData();
    formData.append(
      'photos',
      new File([bigBuffer], 'huge.png', { type: 'image/png' }),
    );

    const request = new Request('http://localhost/api/listings/5/photos', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request, { params: Promise.resolve({ id: '5' }) });

    expect(response.status).toBe(413);
    expect(vi.mocked(fs.promises.writeFile)).not.toHaveBeenCalled();
  });
});
