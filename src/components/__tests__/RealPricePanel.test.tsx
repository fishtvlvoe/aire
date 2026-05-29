import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

vi.mock("@/lib/real-price-query", () => ({
  queryRealPrice: vi.fn(),
}));

import { queryRealPrice } from "@/lib/real-price-query";
import { RealPricePanel } from "../RealPricePanel";

const mockQueryRealPrice = vi.mocked(queryRealPrice);

const defaultProps = {
  district: "東區",
  keyword: "裕農路",
};

describe("RealPricePanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("idle 狀態顯示『查實價登錄』按鈕", () => {
    render(<RealPricePanel {...defaultProps} />);
    expect(screen.getByRole("button", { name: "查實價登錄" })).toBeInTheDocument();
  });

  it("點擊按鈕後顯示 loading spinner", async () => {
    const user = userEvent.setup();
    mockQueryRealPrice.mockImplementation(
      () => new Promise(() => undefined) as unknown as ReturnType<typeof queryRealPrice>,
    );

    render(<RealPricePanel {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "查實價登錄" }));

    expect(screen.getByTestId("real-price-loading")).toBeInTheDocument();
  });

  it("成功後顯示 3 筆 mock 記錄", async () => {
    const user = userEvent.setup();
    mockQueryRealPrice.mockResolvedValue([
      {
        address: "台南市東區裕農路123號",
        total_price: 12800000,
        area: 32.5,
        unit_price: 393846,
        date: "2024-01-15",
        type: "大樓",
      },
      {
        address: "台南市東區裕農路456號5樓",
        total_price: 9500000,
        area: 24.8,
        unit_price: 383065,
        date: "2023-11-20",
        type: "大樓",
      },
      {
        address: "台南市東區裕農路789號3樓之2",
        total_price: 15200000,
        area: 42.1,
        unit_price: 361045,
        date: "2024-03-08",
        type: "大樓",
      },
    ]);

    render(<RealPricePanel {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "查實價登錄" }));

    await waitFor(() => {
      expect(screen.getByText("台南市東區裕農路123號")).toBeInTheDocument();
      expect(screen.getByText("台南市東區裕農路456號5樓")).toBeInTheDocument();
      expect(screen.getByText("台南市東區裕農路789號3樓之2")).toBeInTheDocument();
    });

    expect(mockQueryRealPrice).toHaveBeenCalledWith(defaultProps.district, defaultProps.keyword, 20);
  });

  it("empty 狀態顯示『查無符合條件的實價登錄資料』", async () => {
    const user = userEvent.setup();
    mockQueryRealPrice.mockResolvedValue([]);

    render(<RealPricePanel {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "查實價登錄" }));

    await waitFor(() => {
      expect(screen.getByText("查無符合條件的實價登錄資料")).toBeInTheDocument();
    });
  });

  it("error 狀態顯示『查詢失敗：{message}』", async () => {
    const user = userEvent.setup();
    mockQueryRealPrice.mockRejectedValue(new Error("boom"));

    render(<RealPricePanel {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "查實價登錄" }));

    await waitFor(() => {
      expect(screen.getByText("查詢失敗：boom")).toBeInTheDocument();
    });
  });

  it("缺少價格欄位時仍可渲染 fallback 文案", async () => {
    const user = userEvent.setup();
    mockQueryRealPrice.mockResolvedValue([
      {
        address: "台南市東區東和路47號3樓",
        area: 32.5,
        unit_price: undefined,
        total_price: undefined,
        date: "2024-01-15",
        type: "大樓",
      },
    ]);

    render(<RealPricePanel {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "查實價登錄" }));

    await waitFor(() => {
      expect(screen.getByText("台南市東區東和路47號3樓")).toBeInTheDocument();
      expect(screen.getByText("成交總價：未提供")).toBeInTheDocument();
      expect(screen.getByText("單價：未提供")).toBeInTheDocument();
    });
  });
});
