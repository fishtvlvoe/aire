import React from "react";
import { Document } from "@react-pdf/renderer";
import { ThemeProvider } from "../pdf-themes/theme-provider";
import { resolveThemeOrFallback } from "../pdf-themes/registry";
import { BasicInfoPage } from "./basic-info";
import { ConditionalSection } from "./conditional-section";
import { ConditionSurvey } from "./condition-survey";
import { Cover } from "./cover";
import { LifeAmenitiesPage } from "./life-amenities";
import { LocationMapPage } from "./location-map";
import { PhotoGallery, type Photo } from "./photo-gallery";

export type PropertyType = "residential" | "land";

export interface SurveyTableSection {
  type: "survey-table";
  rows: number;
}

export interface PhotoGridSection {
  type: "photo-grid";
  photos: Photo[];
}

export interface ConditionalWrappedSection {
  type: "conditional";
  condition: boolean;
  content: SurveyTableSection | PhotoGridSection;
}

export type DisclosureSection = SurveyTableSection | PhotoGridSection | ConditionalWrappedSection;

export interface DisclosureDocOptions {
  propertyType: PropertyType;
  caseId: string;
  logoDataUrl?: string;
  sections: DisclosureSection[];
}

export interface PageCountResult {
  photoPages: number;
  emptyCells: number;
  surveyTemplate: PropertyType;
  tableHeaderRepeated: boolean;
}

function assertCaseId(caseId: string): void {
  if (!caseId || caseId.trim().length === 0) {
    throw new Error("caseId is required");
  }
}

function flattenSections(sections: DisclosureSection[]): (SurveyTableSection | PhotoGridSection)[] {
  const visible: (SurveyTableSection | PhotoGridSection)[] = [];
  for (const section of sections) {
    if (section.type === "conditional") {
      if (section.condition) visible.push(section.content);
      continue;
    }
    visible.push(section);
  }
  return visible;
}

export function countPages(options: DisclosureDocOptions): PageCountResult {
  assertCaseId(options.caseId);
  const visibleSections = flattenSections(options.sections);
  const photos = visibleSections
    .filter((section): section is PhotoGridSection => section.type === "photo-grid")
    .flatMap((section) => section.photos);
  const photoPages = photos.length === 0 ? 0 : Math.ceil(photos.length / 4);
  const emptyCells = photoPages * 4 - photos.length;
  const tableHeaderRepeated = visibleSections.some(
    (section) => section.type === "survey-table" && section.rows > 30
  );

  return {
    photoPages,
    emptyCells,
    surveyTemplate: options.propertyType,
    tableHeaderRepeated,
  };
}

export function buildDisclosureDoc(options: DisclosureDocOptions): React.ReactElement {
  assertCaseId(options.caseId);
  const { theme } = resolveThemeOrFallback("theme-a-minimal");
  const caseData: Record<string, unknown> = {
    caseId: options.caseId,
    caseType: options.propertyType,
    propertyName: `案件 ${options.caseId}`,
    surveyRows: 30,
  };
  const visibleSections = flattenSections(options.sections);
  const photos = visibleSections
    .filter((section): section is PhotoGridSection => section.type === "photo-grid")
    .flatMap((section) => section.photos);
  const maxSurveyRows = visibleSections
    .filter((section): section is SurveyTableSection => section.type === "survey-table")
    .reduce((max, section) => Math.max(max, section.rows), 30);

  return (
    <ThemeProvider theme={theme}>
      <Document title={`Disclosure ${options.caseId} Page 1`} subject="Page 1 / N">
        <Cover caseData={caseData} logo={options.logoDataUrl} />
        <BasicInfoPage caseData={caseData} logo={options.logoDataUrl} />
        <LocationMapPage logo={options.logoDataUrl} />
        <LifeAmenitiesPage logo={options.logoDataUrl} />
        <ConditionSurvey caseData={{ ...caseData, surveyRows: maxSurveyRows }} logo={options.logoDataUrl} />
        <ConditionalSection condition={photos.length > 0}>
          <PhotoGallery photos={photos} logo={options.logoDataUrl} />
        </ConditionalSection>
      </Document>
    </ThemeProvider>
  );
}
