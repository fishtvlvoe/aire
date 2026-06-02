import React from "react";
import { Page } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";

import { LAND_SURVEY_QUESTIONS } from "@/lib/disclosure-schema-land-survey";
import { LandConditionSurveyPages } from "../land-condition-survey";

function collectText(node: unknown): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectText).join("");
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<Record<string, unknown>>;
    if (typeof element.type === "function") {
      const render = element.type as (props: Record<string, unknown>) => React.ReactNode;
      return collectText(render(element.props));
    }
    const props = element.props as { children?: React.ReactNode };
    return collectText(props.children);
  }
  return "";
}

function countPages(node: unknown): number {
  if (node === null || node === undefined || typeof node === "boolean") return 0;
  if (typeof node === "string" || typeof node === "number") return 0;
  if (Array.isArray(node)) return node.reduce((sum, child) => sum + countPages(child), 0);
  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<Record<string, unknown>>;
    if (typeof element.type === "function") {
      const render = element.type as (props: Record<string, unknown>) => React.ReactNode;
      return countPages(render(element.props));
    }
    const props = element.props as { children?: React.ReactNode };
    return ((element.type as unknown) === Page ? 1 : 0) + countPages(props.children);
  }
  return 0;
}

describe("LandConditionSurveyPages", () => {
  it("renders the 34 buyer-facing land survey questions on one page", () => {
    const element = <LandConditionSurveyPages surveyData={null} />;
    const text = collectText(element);

    expect(countPages(element)).toBe(1);
    expect(text).toContain("1.");
    expect(text).toContain("34.");
    expect(text).not.toContain("35.");
    expect(text).toContain(LAND_SURVEY_QUESTIONS[0].label);
    expect(text).toContain(LAND_SURVEY_QUESTIONS[33].label);
    expect(text).not.toContain(LAND_SURVEY_QUESTIONS[34].label);
    expect(text).not.toContain("未填");
  });

  it("moves nuisance facilities to the final question", () => {
    const text = collectText(<LandConditionSurveyPages surveyData={null} />);
    const nuisanceLabel = LAND_SURVEY_QUESTIONS[13].label;
    const originalQ15Label = LAND_SURVEY_QUESTIONS[14].label;

    expect(text.indexOf(`14.${originalQ15Label}`)).toBeGreaterThan(-1);
    expect(text.indexOf(`34.${nuisanceLabel}`)).toBeGreaterThan(text.indexOf(`14.${originalQ15Label}`));
  });
});
