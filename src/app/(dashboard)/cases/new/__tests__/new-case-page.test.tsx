import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

vi.mock("@/lib/land-registry-api", () => ({
  addressLookup: vi.fn(),
}));

import NewCasePage from "../page";
import { casesApi } from "@/lib/cases-api";
import { addressLookup } from "@/lib/land-registry-api";

const mockAddressLookup = vi.mocked(addressLookup);
const mockCreateCase = vi.mocked(casesApi.create);

describe("NewCasePage address-first flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "0001-0001",
        address: "宜蘭縣五結鄉協和村親河路二段 1 號",
        lot_number: "0001",
        building_number: "0001",
      },
    ]);
  });

  it("starts with address-first registry detection instead of property type selection", () => {
    render(<NewCasePage />);

    expect(screen.getByRole("heading", { name: "新增案件" })).toBeInTheDocument();
    expect(screen.getByLabelText("地址 *")).toBeInTheDocument();
    expect(screen.queryByText("物件類型")).not.toBeInTheDocument();
  });

  it("classifies address through registry lookup and only shows manual property type fallback when needed", async () => {
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 1 號" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    await waitFor(() => {
      expect(mockAddressLookup).toHaveBeenCalledWith("宜蘭縣五結鄉協和村親河路二段 1 號");
    });
    expect(screen.getByText("已找到 1 筆土地、1 筆建物")).toBeInTheDocument();
    expect(screen.queryByLabelText("物件類型")).not.toBeInTheDocument();

    mockAddressLookup.mockResolvedValue([]);
    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 候選多筆" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    await waitFor(() => {
      expect(screen.getByLabelText("物件類型")).toBeInTheDocument();
    });
  });

  it("runs registry detection from the primary submit button before case creation", async () => {
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "台南市永康區勝利街58巷4號1樓" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    await waitFor(() => {
      expect(mockAddressLookup).toHaveBeenCalledWith("台南市永康區勝利街58巷4號1樓");
    });
    expect(mockCreateCase).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "建立案件" })).toBeInTheDocument();
  });

  it("shows manual fallback when registry returns multiple candidates", async () => {
    mockAddressLookup.mockResolvedValue([
      {
        parcel_id: "0001-0000",
        address: "宜蘭縣五結鄉協和村親河路二段 候選多筆",
        lot_number: "0001",
        building_number: "0000",
      },
      {
        parcel_id: "0001-0001",
        address: "宜蘭縣五結鄉協和村親河路二段 候選多筆",
        lot_number: "0001",
        building_number: "0001",
      },
    ]);
    render(<NewCasePage />);

    fireEvent.change(screen.getByLabelText("地址 *"), {
      target: { value: "宜蘭縣五結鄉協和村親河路二段 候選多筆" },
    });
    fireEvent.click(screen.getByRole("button", { name: "判斷地政資料" }));

    await waitFor(() => {
      expect(screen.getByText("找到多筆候選地政資料，請人工確認土地或建物")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("物件類型")).toBeInTheDocument();
  });
});
