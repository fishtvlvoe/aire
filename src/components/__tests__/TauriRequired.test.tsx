import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { TauriRequired } from "../TauriRequired";

describe("TauriRequired", () => {
  it("renders required copy", () => {
    render(<TauriRequired />);

    expect(screen.getByText("AIRE")).toBeInTheDocument();
    expect(screen.getByText("此功能需在 AIRE 桌面 App 中使用")).toBeInTheDocument();
    expect(
      screen.getByText("請開啟 AIRE 桌面應用程式以使用完整功能"),
    ).toBeInTheDocument();
  });
});
