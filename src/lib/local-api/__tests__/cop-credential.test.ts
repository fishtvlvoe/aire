/**
 * Wave 1 紅燈 1.4 — COP credential 持久化：save → reload → read，且非明碼
 *
 * 場景：儲存 COP 帳密 → 模擬重啟 → 讀回，確認帳密存在且儲存為非明碼（加密）。
 * 現況：Node 側無 credential storage 模組 → import 失敗 → 紅燈。
 * 轉綠時機：Wave 3 task 3.3 建立 Node COP credential storage（DPAPI 或加密 JSON）。
 *
 * 設計依據：design.md Decision 7（Windows DPAPI 或加密 JSON，禁止明碼）
 */
/**
 * Wave 1 紅燈 1.4 — COP credential 持久化：save → reload → read，且非明碼
 *
 * 場景：儲存 COP 帳密 → 模擬重啟 → 讀回，確認帳密存在且儲存為非明碼（加密）。
 * 現況：Node 側無 credential storage，stub 拋 NodeCopCredentialStoreNotImplementedError → 紅燈。
 * 轉綠時機：Wave 3 task 3.3 建立 Node COP credential storage（DPAPI 或加密 JSON）。
 *
 * 設計依據：design.md Decision 7（Windows DPAPI 或加密 JSON，禁止明碼）
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  saveCopCredential,
  readCopCredential,
  readRawCopCredential,
  reloadStore,
} from "@/lib/local-api/cop-credential-store";

describe("Wave 1 紅燈 1.4 — COP credential：save → reload → read 非明碼", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("存帳密後重新載入，讀回遮罩形式（非明碼 secret）（現 Node 無 storage → 紅燈）", async () => {
    const TEST_CLIENT_ID = "cop_test_client_abc123";
    const TEST_SECRET = "super-secret-password-9527";

    // ★ 紅燈斷言：saveCopCredential 不能拋錯（現拋 NotImplementedError → 紅燈）
    // Wave 3 task 3.3 建立 credential storage 後，此測試轉綠。
    await saveCopCredential(TEST_CLIENT_ID, TEST_SECRET);

    // 模擬重啟（清除記憶體快取）
    await reloadStore();

    // 重啟後讀回
    const cred = await readCopCredential();
    expect(cred, "重啟後 credential 消失——持久化未實作").not.toBeNull();

    // 帳密存在
    expect(cred!.hasSecret).toBe(true);
    expect(cred!.clientIdMasked).toBeTruthy();
    expect(cred!.savedAt).toBeTruthy();

    // 遮罩驗證：clientIdMasked 不得等於原始明碼 clientId
    expect(cred!.clientIdMasked).not.toBe(TEST_CLIENT_ID);

    // 關鍵安全斷言：回傳物件不得包含明碼 secret
    const responseStr = JSON.stringify(cred);
    expect(
      responseStr.includes(TEST_SECRET),
      "credential 回傳包含明碼 secret——禁止（Decision 7）",
    ).toBe(false);
  });

  it("本機 Web 有 .env COP 帳密時優先使用 .env，避免讀到設定頁舊帳密", async () => {
    vi.stubEnv("LAND_REGISTRY_CLIENT_ID", "env_client_efd5");
    vi.stubEnv("LAND_REGISTRY_CLIENT_SECRET", "env-secret");

    await saveCopCredential("stale_client_c123", "stale-secret");
    await reloadStore();

    await expect(readRawCopCredential()).resolves.toEqual({
      clientId: "env_client_efd5",
      secret: "env-secret",
    });
    await expect(readCopCredential()).resolves.toMatchObject({
      clientIdMasked: expect.stringContaining("efd5"),
      hasSecret: true,
      savedAt: "env",
    });
  });
});
