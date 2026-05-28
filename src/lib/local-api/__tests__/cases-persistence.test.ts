/**
 * Wave 1 紅燈 1.3 — 案件持久化（Node SQLite）
 *
 * 場景：透過 Node cases API 建立 case → 模擬重啟（重新初始化 store）→ get 仍讀得到。
 * 現況：Node 側完全沒有 SQLite，cases API 模組不存在 → import 失敗 → 紅燈。
 * 轉綠時機：Wave 3 task 3.2 建立 /api/local/cases route 與 SQLite adapter。
 *
 * 設計依據：design.md Decision 4（本機資料目錄）、Decision 5（Rust IPC 搬 Node）
 */
/**
 * Wave 1 紅燈 1.3 — 案件持久化（Node SQLite）
 *
 * 場景：透過 Node cases API 建立 case → 模擬重啟（重新初始化 store）→ get 仍讀得到。
 * 現況：Node 側完全沒有 SQLite，cases-store stub 拋 NodeCasesStoreNotImplementedError → 紅燈。
 * 轉綠時機：Wave 3 task 3.2 建立 /api/local/cases route 與 SQLite adapter。
 *
 * 設計依據：design.md Decision 4（本機資料目錄）、Decision 5（Rust IPC 搬 Node）
 */
import { describe, expect, it } from "vitest";
import type { CreateCaseInput } from "@/lib/local-api/contract";
import { createCase, getCase, reinitializeStore } from "@/lib/local-api/cases-store";

describe("Wave 1 紅燈 1.3 — 案件持久化：重啟後仍讀得到", () => {
  it("建立 case 後模擬 store 重啟，get 仍回相同 case（現 Node 無 SQLite → 紅燈）", async () => {
    const input: CreateCaseInput = {
      property_type: "residential",
      land_lot_no: "東光段0101",
      address: "新竹市東區光復路二段101號",
      owner_name: "測試地主",
      case_no: "TEST-2026-001",
    };

    // ★ 紅燈斷言：createCase 不能拋錯，且必須回傳有效 CaseRow（現拋錯 → 紅燈）
    // Wave 3 task 3.2 建立 SQLite adapter 後，此測試轉綠。
    const created = await createCase(input);

    expect(created.id, "createCase 應回傳帶 id 的 CaseRow").toBeTruthy();
    expect(created.address).toBe(input.address);
    expect(created.status).toBe("draft");

    // 模擬重啟：重新初始化 store（清空記憶體快取，只留 SQLite 持久化資料）
    await reinitializeStore();

    // 重啟後仍能讀到相同 case
    const retrieved = await getCase(created.id);
    expect(retrieved, "重啟後 case 消失——SQLite 持久化未實作").not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.address).toBe(input.address);
    expect(retrieved?.case_no).toBe(input.case_no);
  });
});
