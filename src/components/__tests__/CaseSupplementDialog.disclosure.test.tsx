import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CaseSupplementDialog } from "../CaseSupplementDialog";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  casesGet: vi.fn(),
  casesUpdate: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: mocks.invoke,
}));

vi.mock("@/lib/cases-api", () => ({
  casesApi: {
    get: mocks.casesGet,
    update: mocks.casesUpdate,
  },
}));

const BASE_CASE = {
  id: "case-001",
  property_type: "residential",
  owner_name: "屋主",
  address: "台南市",
  case_name: "測試",
};

describe("CaseSupplementDialog — disclosure 缺漏欄位顯示", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.casesGet.mockResolvedValue(BASE_CASE);
    mocks.casesUpdate.mockResolvedValue({});
  });

  it("get_draft 回傳空值欄位時，顯示對應 disclosure input", async () => {
    // Arrange
    mocks.invoke.mockImplementation((cmd: string) => {
      if (cmd === "get_draft") {
        return Promise.resolve({
          payload_json: '{"building_lot_no":"","land_lot_no":""}',
        });
      }
      return Promise.resolve(null);
    });

    // Act
    render(
      <CaseSupplementDialog caseId="case-001" open={true} onClose={() => undefined} />
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByLabelText("建物地號")).toBeInTheDocument();
      expect(screen.getByLabelText("土地地號")).toBeInTheDocument();
    });
  });

  it("get_draft 回傳全填 payload 時，不顯示 building_lot_no disclosure input", async () => {
    // Arrange
    mocks.invoke.mockImplementation((cmd: string) => {
      if (cmd === "get_draft") {
        return Promise.resolve({
          payload_json: '{"building_lot_no":"A-001","land_lot_no":"B-002"}',
        });
      }
      return Promise.resolve(null);
    });

    // Act
    render(
      <CaseSupplementDialog caseId="case-001" open={true} onClose={() => undefined} />
    );

    // Assert
    await waitFor(() => {
      expect(screen.queryByLabelText("建物地號")).not.toBeInTheDocument();
    });
    expect(screen.queryByLabelText("土地地號")).not.toBeInTheDocument();
  });
});
