import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ComingSoonCard } from "@/components/ComingSoonCard";

describe("ComingSoonCard", () => {
  it("renders title, clock icon, and coming-soon text", () => {
    render(<ComingSoonCard title="申請說明" />);

    expect(screen.getByText("申請說明")).toBeInTheDocument();
    expect(screen.getByText("敬請期待")).toBeInTheDocument();
    expect(screen.getByTestId("coming-soon-clock-icon")).toBeInTheDocument();
  });
});
