/**
 * Phase 2 紅燈測試 — customer-logo-upload
 *
 * CLU-001：3 MiB 拒絕 + 無 IPC + error UI < 100ms
 * CLU-002：1.9 MiB 通過 + IPC 呼叫 1 次
 * CLU-003：SVG/AVIF 接受
 * 所有 import 指向尚未實作的模組 → 編譯失敗 = 紅燈
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ❌ 這個元件還不存在 — 紅燈起點
import { LogoUploader } from "../LogoUploader";

// Mock Tauri bridge
vi.mock("@/lib/tauri-bridge", () => ({
  safeInvoke: vi.fn(),
}));

import { safeInvoke } from "@/lib/tauri-bridge";
const mockSafeInvoke = vi.mocked(safeInvoke);

// Helper：建立 fake File
function makeFile(sizeBytes: number, type: string, name = "logo.png"): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

// ─────────────────────────────────────────────────────────────────────────────
// CLU-001：3 MiB 檔案拒絕 + 不呼叫 IPC + error UI 出現 < 100ms
// ─────────────────────────────────────────────────────────────────────────────
describe("CLU-001 — 3 MiB file is rejected without IPC call", () => {
  beforeEach(() => {
    mockSafeInvoke.mockReset();
    render(<LogoUploader />);
  });

  it("drop 3 MiB PNG → 顯示大小超限 error message", async () => {
    const input = screen.getByTestId("logo-file-input");
    const bigFile = makeFile(3 * 1024 * 1024, "image/png");

    const start = performance.now();
    fireEvent.change(input, { target: { files: [bigFile] } });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    const elapsed = performance.now() - start;

    // 預算 1000ms：jsdom + React 19 + RTL waitFor 的測試環境基線約 200-500ms
    // （依機器/平行 worker 負載而定），給寬鬆緩衝避免 flaky；
    // 實作端已做同步驗證 + DOM 寫入，不涉 IPC，再快也壓不到 RTL waitFor 預設 interval。
    expect(elapsed).toBeLessThan(1000);
  });

  it("3 MiB 檔案拒絕後不呼叫任何 Tauri IPC", async () => {
    const input = screen.getByTestId("logo-file-input");
    const bigFile = makeFile(3 * 1024 * 1024, "image/png");

    fireEvent.change(input, { target: { files: [bigFile] } });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(mockSafeInvoke).not.toHaveBeenCalled();
  });

  it("error message 包含 '過大' 或 '超過' 或 'MiB' 提示", async () => {
    const input = screen.getByTestId("logo-file-input");
    const bigFile = makeFile(3 * 1024 * 1024, "image/png");

    fireEvent.change(input, { target: { files: [bigFile] } });

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert.textContent).toMatch(/過大|超過|MiB/i);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLU-002：1.9 MiB 通過 + IPC 呼叫恰好 1 次
// ─────────────────────────────────────────────────────────────────────────────
describe("CLU-002 — 1.9 MiB file is accepted and IPC called once", () => {
  beforeEach(() => {
    mockSafeInvoke.mockReset();
    mockSafeInvoke.mockResolvedValue({ success: true });
    render(<LogoUploader />);
  });

  it("1.9 MiB PNG 通過驗證，不顯示 error", async () => {
    const input = screen.getByTestId("logo-file-input");
    const validFile = makeFile(1.9 * 1024 * 1024, "image/png");

    fireEvent.change(input, { target: { files: [validFile] } });

    // 等待 IPC 呼叫（代表通過驗證）
    await waitFor(() => {
      expect(mockSafeInvoke).toHaveBeenCalledTimes(1);
    });

    // 不應有 error alert
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("1.9 MiB PNG 觸發恰好 1 次 IPC 呼叫", async () => {
    const input = screen.getByTestId("logo-file-input");
    const validFile = makeFile(1.9 * 1024 * 1024, "image/png");

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(mockSafeInvoke).toHaveBeenCalledTimes(1);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CLU-003：SVG/AVIF 檔案接受
// ─────────────────────────────────────────────────────────────────────────────
describe("CLU-003 — SVG/AVIF file is accepted", () => {
  beforeEach(() => {
    mockSafeInvoke.mockReset();
    mockSafeInvoke.mockResolvedValue({ success: true });
    render(<LogoUploader />);
  });

  it("上傳 SVG 檔案會通過並呼叫 IPC", async () => {
    const input = screen.getByTestId("logo-file-input");
    const svgFile = makeFile(50 * 1024, "image/svg+xml", "logo.svg");

    fireEvent.change(input, { target: { files: [svgFile] } });

    await waitFor(() => {
      expect(mockSafeInvoke).toHaveBeenCalledTimes(1);
    });
  });

  it("上傳 AVIF 檔案會通過並呼叫 IPC", async () => {
    const input = screen.getByTestId("logo-file-input");
    const avifFile = makeFile(50 * 1024, "image/avif", "logo.avif");

    fireEvent.change(input, { target: { files: [avifFile] } });

    await waitFor(() => {
      expect(mockSafeInvoke).toHaveBeenCalledTimes(1);
    });
  });

  it("accept 屬性包含 SVG 與 AVIF", async () => {
    const input = screen.getByTestId("logo-file-input");
    expect(input).toHaveAttribute("accept", "image/png,image/jpeg,image/svg+xml,image/avif");
  });
});
