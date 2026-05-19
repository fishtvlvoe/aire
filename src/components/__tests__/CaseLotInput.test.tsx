import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// 紅燈測試：CaseLotInput 元件（multi-lot-support）

describe("CaseLotInput", () => {
  it("初始一個地號 input row", async () => {
    const { CaseLotInput } = await import("../CaseLotInput");
    const onChange = vi.fn();
    render(<CaseLotInput value={["123-4"]} onChange={onChange} />);
    const container = screen.getByTestId("case-lot-inputs");
    const inputs = container.querySelectorAll("input");
    expect(inputs).toHaveLength(1);
  });

  it("點擊 ＋ 新增第二個 row", async () => {
    const { CaseLotInput } = await import("../CaseLotInput");
    let value = ["123-4"];
    const onChange = vi.fn((lots: string[]) => { value = lots; });
    const { rerender } = render(<CaseLotInput value={value} onChange={onChange} />);
    const addBtn = screen.getByRole("button", { name: /＋/ });
    fireEvent.click(addBtn);
    expect(onChange).toHaveBeenCalledWith(["123-4", ""]);
  });

  it("只有 1 個 row 時刪除按鈕禁用", async () => {
    const { CaseLotInput } = await import("../CaseLotInput");
    render(<CaseLotInput value={["123-4"]} onChange={vi.fn()} />);
    const removeBtns = screen.queryAllByRole("button", { name: /ㄧ|－|remove|delete/i });
    // 只有 1 筆時不應有可用的刪除按鈕
    const enabledRemove = removeBtns.filter(b => !(b as HTMLButtonElement).disabled);
    expect(enabledRemove).toHaveLength(0);
  });

  it("2 個 row 時可刪除第一個", async () => {
    const { CaseLotInput } = await import("../CaseLotInput");
    const onChange = vi.fn();
    render(<CaseLotInput value={["123-4", "456-7"]} onChange={onChange} />);
    const removeBtns = screen.getAllByRole("button", { name: /ㄧ|－/i });
    expect(removeBtns.length).toBeGreaterThanOrEqual(1);
    const enabledRemove = removeBtns.filter(b => !(b as HTMLButtonElement).disabled);
    expect(enabledRemove.length).toBeGreaterThanOrEqual(1);
  });
});
