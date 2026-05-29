/**
 * Wave 1 紅燈 1.1 — GET /api/health 應回 200 {status:'ok', version}
 *
 * 現況：route.ts 存在但回 501 Not Implemented（佔位 stub）→ 斷言 200 失敗 → 紅燈。
 * 轉綠時機：Wave 2 task 2.2 把 stub 取代為真實實作（回 200 + {status:'ok', version}）。
 *
 * 設計依據：tasks.md Wave 1 task 1.1 / Wave 2 task 2.2
 * （launcher 依賴此 route polling 判斷 server 就緒）
 */
import { describe, expect, it } from "vitest";
import { GET } from "../route";

describe("GET /api/health（Wave 1 紅燈 1.1）", () => {
  it("應回 200 且 body 包含 status:'ok' 與 version 字串（現為 stub 回 501 → 紅燈）", async () => {
    const res = GET();

    // ★ 紅燈斷言：現況 stub 回 501，Wave 2 task 2.2 實作後改回 200。
    expect(res.status, "health route 回 501 Not Implemented——Wave 2 task 2.2 待實作").toBe(200);

    const body = (await res.json()) as { status?: string; version?: string };
    expect(body.status).toBe("ok");
    expect(typeof body.version).toBe("string");
    expect(body.version!.length).toBeGreaterThan(0);
  });
});
