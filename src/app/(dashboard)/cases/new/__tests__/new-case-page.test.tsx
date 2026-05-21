import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/hooks/useIpcErrorToast", () => ({
  useIpcErrorToast: () => ({ handleError: vi.fn() }),
}));

vi.mock("@/lib/cases-api", () => ({
  casesApi: {
    create: vi.fn().mockResolvedValue({ id: "case-1" }),
  },
}));

import NewCasePage from "../page";

describe("NewCasePage address-first flow", () => {
  it("starts with address-first registry detection instead of property type selection", () => {
    render(<NewCasePage />);

    expect(screen.getByRole("heading", { name: "新增案件" })).toBeInTheDocument();
    expect(screen.getByLabelText("地址 *")).toBeInTheDocument();
    expect(screen.queryByText("物件類型")).not.toBeInTheDocument();
  });

  it("classifies address and only shows manual property type fallback when needed", () => {
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 1 號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    expect(screen.getByText("已找到 2 筆土地、1 筆建物")).toBeInTheDocument();
    expect(screen.queryByLabelText("物件類型")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("地址 *"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    expect(screen.getByLabelText("物件類型")).toBeInTheDocument();
  });

  it("shows manual fallback when registry returns multiple candidates", () => {
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 候選多筆" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    expect(screen.getByText("找到多筆候選地政資料，請人工確認土地或建物")).toBeInTheDocument();
    expect(screen.getByLabelText("物件類型")).toBeInTheDocument();
  });
});
