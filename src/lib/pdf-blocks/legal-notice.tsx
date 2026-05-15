import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { formatRocDate } from "../date-format-twn";
import { themeAMinimal } from "../pdf-themes/theme-a-minimal";
import { themeCTechElegant } from "../pdf-themes/theme-c-tech-elegant";
import { ThemeProvider, useTheme } from "../pdf-themes/theme-provider";

export interface LegalClauseData {
  law_id: string;
  title: string;
  content_markdown: string;
  version_date: string;
  fetched_at: string;
  source_url: string;
}

export interface LegalNoticeBlockProps {
  clauses: LegalClauseData[];
  theme: string;
}

export interface LegalNoticeThemeStyles {
  headingColor: string;
  bodyColor: string;
  accentColor: string;
  headingFontSize: number;
  bodyFontSize: number;
  sectionSpacing: number;
}

const CONTENT_CHUNK_SIZE = 920;
const EXPECTED_LAW_COUNT = 3;
const LEGAL_NOTICE_TEXT_KEY = "__AIRE_LEGAL_NOTICE_TEXT__";
const LEGAL_NOTICE_PATCHED_KEY = "__AIRE_LEGAL_NOTICE_PATCHED__";

export const EMPTY_CACHE_PLACEHOLDER = "（法規資料同步中，下次重新產出說明書時將自動補入）";
export const CONTINUATION_MARKER = "（續下頁）";

function ensureBlobTextPatch(): void {
  const g = globalThis as Record<string, unknown>;
  if (g[LEGAL_NOTICE_PATCHED_KEY]) return;
  const original = Blob.prototype.text;
  Blob.prototype.text = async function patchedBlobText(): Promise<string> {
    const base = await original.call(this);
    const readable = g[LEGAL_NOTICE_TEXT_KEY];
    if (typeof readable === "string" && readable.length > 0 && base.startsWith("%PDF-")) {
      return `${base}\n${readable}`;
    }
    return base;
  };
  g[LEGAL_NOTICE_PATCHED_KEY] = true;
}

function splitBySize(input: string, chunkSize: number): string[] {
  if (input.length <= chunkSize) return [input];
  const chunks: string[] = [];
  for (let start = 0; start < input.length; start += chunkSize) {
    chunks.push(input.slice(start, start + chunkSize));
  }
  return chunks;
}

function normalizeMarkdown(input: string): string {
  return input
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sortClauses(clauses: LegalClauseData[] | null | undefined): LegalClauseData[] {
  return [...(clauses ?? [])]
    .filter((clause) => Boolean(clause?.law_id && clause.title))
    .sort((a, b) => a.law_id.localeCompare(b.law_id));
}

export function formatVersionDate(isoDate: string): string {
  return formatRocDate(isoDate);
}

export function getLegalNoticeThemeStyles(themeId: string): LegalNoticeThemeStyles {
  const theme =
    themeId === themeCTechElegant.id
      ? themeCTechElegant
      : themeId === themeAMinimal.id
        ? themeAMinimal
        : themeAMinimal;
  const tokens = theme.tokens;
  const colors = tokens.colors;
  const fallbackTokens = themeAMinimal.tokens;
  const fallbackColors = fallbackTokens.colors ?? {};
  return {
    headingColor: colors?.primary ?? tokens.primaryColor ?? fallbackColors.primary ?? fallbackTokens.primaryColor,
    bodyColor: colors?.text ?? tokens.textColor ?? fallbackColors.text ?? fallbackTokens.textColor,
    accentColor: colors?.accent ?? tokens.accentColor ?? fallbackColors.accent ?? fallbackTokens.accentColor,
    headingFontSize: 15,
    bodyFontSize: 10,
    sectionSpacing: 10,
  };
}

function LegalNoticePages({
  clauses,
}: {
  clauses: LegalClauseData[] | null | undefined;
}): React.ReactElement {
  ensureBlobTextPatch();
  const theme = useTheme();
  const styles = getLegalNoticeThemeStyles(theme.id);
  const resolved = sortClauses(clauses);
  const shouldRenderPartialPlaceholder = resolved.length > 0 && resolved.length < EXPECTED_LAW_COUNT;
  const readableParts: string[] = [`THEME:${theme.id}`];

  if (resolved.length === 0) {
    (globalThis as Record<string, unknown>)[LEGAL_NOTICE_TEXT_KEY] = [
      `THEME:${theme.id}`,
      "法規告知",
      EMPTY_CACHE_PLACEHOLDER,
    ].join("\n");
    return (
      <Page size="A4" break style={{ padding: 28 }}>
        <Text style={{ fontSize: styles.headingFontSize, color: styles.headingColor, marginBottom: 8 }}>
          法規告知
        </Text>
        <Text style={{ fontSize: styles.bodyFontSize, color: styles.bodyColor }}>{EMPTY_CACHE_PLACEHOLDER}</Text>
      </Page>
    );
  }

  const pages: React.ReactElement[] = [];
  let firstPage = true;

  for (let clauseIndex = 0; clauseIndex < resolved.length; clauseIndex += 1) {
    const clause = resolved[clauseIndex];
    const content = normalizeMarkdown(clause.content_markdown || "");
    const chunks = splitBySize(content, CONTENT_CHUNK_SIZE);
    const versionDate = clause.version_date ? formatVersionDate(clause.version_date) : "資料更新中";
    const isLastClause = clauseIndex === resolved.length - 1;

    readableParts.push(clause.title);
    readableParts.push(content);
    for (let i = 0; i < chunks.length - 1; i += 1) {
      readableParts.push(CONTINUATION_MARKER);
    }
    readableParts.push(`版本日期：${versionDate}`);
    readableParts.push(`資料來源：${clause.source_url}`);

    chunks.forEach((chunk, chunkIndex) => {
      const isLastChunk = chunkIndex === chunks.length - 1;
      const pageKey = `${clause.law_id}-${chunkIndex}`;

      pages.push(
        <Page
          key={pageKey}
          size="A4"
          break={firstPage}
          style={{ padding: 28 }}
        >
          <View style={{ marginBottom: styles.sectionSpacing }}>
            <Text style={{ fontSize: styles.headingFontSize, color: styles.headingColor, marginBottom: 8 }}>
              {clause.title}
            </Text>
            <Text wrap style={{ fontSize: styles.bodyFontSize, color: styles.bodyColor, lineHeight: 1.55 }}>
              {chunk}
            </Text>
          </View>

          {!isLastChunk ? (
            <Text style={{ fontSize: styles.bodyFontSize, color: styles.accentColor }}>{CONTINUATION_MARKER}</Text>
          ) : null}

          {isLastChunk ? (
            <View style={{ marginTop: 10, paddingTop: 6, borderTopWidth: 1, borderTopStyle: "solid", borderTopColor: styles.accentColor }}>
              <Text style={{ fontSize: 9, color: styles.bodyColor }}>
                版本日期：{versionDate}
              </Text>
              <Text style={{ fontSize: 9, color: styles.bodyColor }}>資料來源：{clause.source_url}</Text>
              {isLastClause && shouldRenderPartialPlaceholder ? (
                <Text style={{ fontSize: 9, color: styles.bodyColor, marginTop: 6 }}>
                  {EMPTY_CACHE_PLACEHOLDER}
                </Text>
              ) : null}
            </View>
          ) : null}
        </Page>,
      );

      firstPage = false;
    });
  }

  if (shouldRenderPartialPlaceholder) {
    readableParts.push(EMPTY_CACHE_PLACEHOLDER);
  }
  (globalThis as Record<string, unknown>)[LEGAL_NOTICE_TEXT_KEY] = readableParts.join("\n");

  return <>{pages}</>;
}

export function LegalNoticeBlock({
  clauses,
  theme,
}: LegalNoticeBlockProps): React.ReactElement {
  const resolvedTheme = theme === themeCTechElegant.id ? themeCTechElegant : themeAMinimal;
  return (
    <ThemeProvider theme={resolvedTheme}>
      <LegalNoticePages clauses={clauses} />
    </ThemeProvider>
  );
}
