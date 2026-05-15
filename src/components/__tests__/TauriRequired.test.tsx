import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { TauriRequired } from "../TauriRequired";

describe("TauriRequired", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders required copy", () => {
    vi.stubEnv("NODE_ENV", "production");
    render(<TauriRequired />);

    expect(screen.getByText("AIRE")).toBeInTheDocument();
    expect(screen.getByText("此功能需在 AIRE 桌面 App 中使用")).toBeInTheDocument();
    expect(
      screen.getByText("請開啟 AIRE 桌面應用程式以使用完整功能"),
    ).toBeInTheDocument();
  });

  it("renders children directly in development env", () => {
    vi.stubEnv("NODE_ENV", "development");
    render(
      <TauriRequired>
        <p>dev-content</p>
      </TauriRequired>,
    );

    expect(screen.getByText("dev-content")).toBeInTheDocument();
    expect(screen.queryByText("此功能需在 AIRE 桌面 App 中使用")).not.toBeInTheDocument();
  });
});
