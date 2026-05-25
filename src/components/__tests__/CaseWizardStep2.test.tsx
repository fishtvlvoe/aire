import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CaseWizardStep2 } from "../case-wizard/CaseWizardStep2";
import type { CaseRow } from "@/lib/cases-api";

const mocks = vi.hoisted(() => ({
  updateCase: vi.fn(),
}));

vi.mock("@/lib/cases-api", () => ({
  casesApi: {
    update: mocks.updateCase,
  },
}));

vi.mock("@/components/PullParcelDataButton", () => ({
  PullParcelDataButton: (props: { onSaved?: (data: Record<string, unknown>) => void }) => (
    <button
      onClick={() =>
        props.onSaved?.({
          land_registry: { data: { lot_number: "0456-0000" } },
          building_registry: { data: { building_number: "建號 778-2" } },
        })
      }
      type="button"
    >
      mock-pull
    </button>
  ),
}));

const baseCase: CaseRow = {
  id: "case-002",
  case_no: "AIRE-2026-002",
  case_name: "文化路土地案",
  property_type: "land",
  land_lot_no: "板橋段二小段 88-1",
  land_lots: ["板橋段二小段 88-1"],
  building_lot_no: null,
  address: "新北市板橋區文化路一段 188 號",
  owner_name: "林大華",
  land_registry_data: null,
  current_step: 2,
  status: "draft",
  created_at: 1,
  updated_at: 1,
};

describe("CaseWizardStep2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateCase.mockResolvedValue(baseCase);
  });

  it("建號輸入框存在且可編輯，失焦時呼叫 update", async () => {
    render(<CaseWizardStep2 caseData={{ ...baseCase, building_lot_no: "778-2" }} />);

    const input = screen.getByLabelText("建號") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("778-2");

    fireEvent.change(input, { target: { value: "999-1" } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mocks.updateCase).toHaveBeenCalledWith("case-002", {
        building_lot_no: "999-1",
      });
    });
  });

  it("fills land/building lot numbers from nested land_registry_data and persists", async () => {
    render(<CaseWizardStep2 caseData={baseCase} />);

    fireEvent.click(screen.getByRole("button", { name: "mock-pull" }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("0456-0000")).toBeInTheDocument();
      expect(screen.getByDisplayValue("建號 778-2")).toBeInTheDocument();
    });

    expect(mocks.updateCase).toHaveBeenCalledWith("case-002", {
      land_lot_no: "0456-0000",
      building_lot_no: "建號 778-2",
      land_registry_data: {
        land_registry: { data: { lot_number: "0456-0000" } },
        building_registry: { data: { building_number: "建號 778-2" } },
      },
    });
  });

  it("shows persisted registry preview with auto-fill targets before PDF export", () => {
    render(
      <CaseWizardStep2
        caseData={{
          ...baseCase,
          property_type: "residential",
          land_registry_data: {
            land_registry: { data: { lot_number: "大安段一小段 123-4", area: 1223.45 } },
            building_registry: {
              data: {
                building_number: "建號 556-1",
                purpose: "住家用",
                material: "鋼筋混凝土造",
                construction_date: "083/10/18",
              },
            },
            building_ownership: {
              data: { owner_name: "陳小美", numerator: 1, denominator: 1 },
            },
          },
        }}
      />,
    );

    expect(screen.getByText("謄本資料預覽")).toBeInTheDocument();
    expect(screen.getByText("地址資料補齊")).toBeInTheDocument();
    expect(screen.getByText("地政自動判斷")).toBeInTheDocument();
    expect(screen.getByText("土地 + 建物")).toBeInTheDocument();
    expect(screen.queryByText("物件類型")).toBeNull();
    expect(screen.getByText("建物標示部")).toBeInTheDocument();
    expect(screen.getByText("住家用")).toBeInTheDocument();
    expect(screen.getByText("鋼筋混凝土造")).toBeInTheDocument();
    expect(screen.getByText("建物標示/法定用途")).toBeInTheDocument();
    expect(screen.queryByText(/MOI_API/)).toBeNull();
  });

  it("shows plain-language manual fallback when registry detection has not found a match", () => {
    render(
      <CaseWizardStep2
        caseData={{
          ...baseCase,
          land_lot_no: "",
          land_lots: [],
          building_lot_no: null,
          land_registry_data: null,
        }}
      />,
    );

    expect(screen.getByText("地址資料補齊")).toBeInTheDocument();
    expect(screen.getByText("需人工確認")).toBeInTheDocument();
    expect(screen.getByText("系統還沒有從地址讀到明確的地號或建號。")).toBeInTheDocument();
    expect(screen.getByLabelText("地號")).toBeInTheDocument();
    expect(screen.getByLabelText("建號")).toBeInTheDocument();
  });

  it("keeps the 38-question field survey out of the initial registry setup UI", () => {
    render(<CaseWizardStep2 caseData={baseCase} />);

    expect(screen.getByText("謄本資料預覽")).toBeInTheDocument();
    expect(screen.queryByText("肆、現況調查表")).toBeNull();
    expect(screen.queryByText("是否有依慣例使用之現況？")).toBeNull();
    expect(screen.queryByText("現場必問工作台")).toBeNull();
    expect(screen.queryByText("秘書後補工作台")).toBeNull();
  });
});
