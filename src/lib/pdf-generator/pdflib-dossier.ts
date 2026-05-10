import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import fontkit from '@pdf-lib/fontkit';
import { PDFDocument, rgb, type PDFImage, type PDFFont, type PDFPage } from 'pdf-lib';
import { DEFAULT_CONTENT_FIELDS, type FieldPosition } from '@/lib/branding/field-layouts';
import { db } from '@/lib/db';
import type { DocumentGeneratorInput } from '@/lib/document-generator/types';
import { TYPESET } from './typesetting';

const A4_WIDTH = TYPESET.pageSize.width;
const A4_HEIGHT = TYPESET.pageSize.height;
const REGULAR_FONT_PATH = path.join(process.cwd(), 'public', 'fonts', 'NotoSansTC-Regular.ttf');
const BOLD_FONT_PATH = path.join(process.cwd(), 'public', 'fonts', 'NotoSansTC-Bold.ttf');
const SAFE_BACKGROUND_PREFIX = '/branding/backgrounds/';

type JsonRecord = Record<string, unknown>;

type ListingRow = {
  id: number;
  address: string | null;
  field_visit_data: string | null;
  supplementary_data: string | null;
  generated_documents: string | null;
};

type BackgroundSetting = {
  cover: string | null;
  content: string | null;
};

type EmbeddedFonts = {
  regular: PDFFont;
  heading: PDFFont;
};

type RenderState = {
  page: PDFPage;
  cursorY: number;
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

function safeParseObject(value: string | null | undefined): JsonRecord {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as JsonRecord) : {};
  } catch {
    return {};
  }
}

function normalizeValue(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function readBackgroundSetting(): BackgroundSetting {
  const rows = db.prepare(
    'SELECT key, value FROM feature_flags WHERE key IN (?, ?)'
  ).all('doc_bg_cover', 'doc_bg_content') as Array<{ key: string; value: string | null }>;

  return {
    cover: rows.find((row) => row.key === 'doc_bg_cover')?.value || null,
    content: rows.find((row) => row.key === 'doc_bg_content')?.value || null,
  };
}

function resolveLocalBackgroundPath(value: string): string | null {
  if (!value.startsWith(SAFE_BACKGROUND_PREFIX)) {
    return null;
  }

  const relative = value.slice(1);
  const absolute = path.resolve(process.cwd(), 'public', relative);
  const backgroundsRoot = path.resolve(process.cwd(), 'public', 'branding', 'backgrounds');

  if (!absolute.startsWith(backgroundsRoot)) {
    return null;
  }

  return absolute;
}

async function loadBackgroundBytes(value: string | null): Promise<Uint8Array | null> {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    const response = await fetch(value);
    if (!response.ok) {
      return null;
    }
    const bytes = await response.arrayBuffer();
    return new Uint8Array(bytes);
  }

  const localPath = resolveLocalBackgroundPath(value);
  if (!localPath || !fs.existsSync(localPath)) {
    return null;
  }

  return new Uint8Array(fs.readFileSync(localPath));
}

function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < 8) {
    return false;
  }
  return (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  );
}

function isJpg(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;
}

async function embedBackgroundImage(pdfDoc: PDFDocument, bytes: Uint8Array | null): Promise<PDFImage | null> {
  if (!bytes) {
    return null;
  }

  try {
    if (isPng(bytes)) {
      return await pdfDoc.embedPng(bytes);
    }
    if (isJpg(bytes)) {
      return await pdfDoc.embedJpg(bytes);
    }
    return null;
  } catch {
    return null;
  }
}

function drawBackground(page: PDFPage, image: PDFImage | null): void {
  if (!image) {
    return;
  }
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: A4_WIDTH,
    height: A4_HEIGHT,
  });
}

function getListingRow(listingId: number): ListingRow | null {
  const row = db.prepare(
    'SELECT id, address, field_visit_data, supplementary_data, generated_documents FROM listings WHERE id = ?'
  ).get(listingId) as ListingRow | undefined;
  return row ?? null;
}

function buildFieldValueMap(
  listingId: number,
  input: DocumentGeneratorInput | undefined,
  listingRow: ListingRow | null,
  now: Date
): Record<string, string> {
  const listingSupplementary = safeParseObject(listingRow?.supplementary_data);
  const listingFieldVisit = safeParseObject(listingRow?.field_visit_data);
  const listingDocs = safeParseObject(listingRow?.generated_documents);
  const overrides = (listingDocs.disclosure_overrides && typeof listingDocs.disclosure_overrides === 'object')
    ? (listingDocs.disclosure_overrides as JsonRecord)
    : {};

  const supplementary = {
    ...listingSupplementary,
    ...(input?.supplementary_data ?? {}),
  };
  const fieldVisit = {
    ...listingFieldVisit,
    ...(input?.field_visit_data ?? {}),
  };

  const base: Record<string, unknown> = {
    'object-id': listingId,
    'object-name': supplementary.property_name ?? fieldVisit.address ?? listingRow?.address,
    'agent-name': supplementary.owner_name ?? fieldVisit.owner_name,
    'store-name': supplementary.store_name ?? supplementary.store,
    'broker-name': supplementary.agent_name ?? supplementary.broker_name,
    'broker-cert': supplementary.agent_cert ?? supplementary.broker_cert,
    'company-name': supplementary.company_name ?? process.env.COMPANY_NAME,
    'company-address': supplementary.company_address ?? listingRow?.address,
    'company-phone': supplementary.company_phone ?? supplementary.agent_phone,
    'document-date': formatDate(now),
  };

  const mapped: Record<string, string> = {};
  for (const field of DEFAULT_CONTENT_FIELDS) {
    const override = overrides[field.fieldKey];
    mapped[field.fieldKey] = normalizeValue(override !== undefined ? override : base[field.fieldKey]);
  }
  return mapped;
}

function getAlignedX(field: FieldPosition, pageWidth: number, textWidth: number): number {
  const boxX = (field.x / 100) * pageWidth;
  const boxWidth = (field.width / 100) * pageWidth;

  if (field.textAlign === 'center') {
    return boxX + (boxWidth - textWidth) / 2;
  }
  if (field.textAlign === 'right') {
    return boxX + boxWidth - textWidth;
  }
  return boxX;
}

function drawContentFields(page: PDFPage, font: PDFFont, fieldMap: Record<string, string>): void {
  for (const field of DEFAULT_CONTENT_FIELDS) {
    const value = fieldMap[field.fieldKey];
    if (!value) {
      continue;
    }

    const fontSize = field.fontSize;
    const textWidth = font.widthOfTextAtSize(value, fontSize);
    const x = Math.max(16, getAlignedX(field, A4_WIDTH, textWidth));
    const yTop = (field.y / 100) * A4_HEIGHT;
    const y = A4_HEIGHT - yTop - fontSize;

    page.drawText(value, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
  }
}

function wrapLineByWidth(line: string, maxWidth: number, font: PDFFont, size: number): string[] {
  if (!line) {
    return [''];
  }

  const chars = Array.from(line);
  const lines: string[] = [];
  let current = '';

  for (const ch of chars) {
    const next = current + ch;
    const width = font.widthOfTextAtSize(next, size);
    if (width <= maxWidth || current.length === 0) {
      current = next;
      continue;
    }
    lines.push(current);
    current = ch;
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function truncateToWidth(text: string, maxWidth: number, font: PDFFont, size: number): string {
  if (!text) {
    return text;
  }

  let out = '';
  for (const ch of Array.from(text)) {
    const next = out + ch;
    if (font.widthOfTextAtSize(next, size) > maxWidth) {
      break;
    }
    out = next;
  }
  return out || text[0] || '';
}

function inlineTokensToText(tokens: any[]): string {
  const parts: string[] = [];
  for (const token of tokens) {
    if (!token || typeof token !== 'object') {
      continue;
    }

    if (typeof token.text === 'string' && token.type !== 'link') {
      if (token.type === 'br') {
        parts.push('\n');
      } else {
        parts.push(token.text);
      }
      continue;
    }

    if (token.type === 'link') {
      if (typeof token.text === 'string') {
        parts.push(token.text);
      } else if (Array.isArray(token.tokens)) {
        parts.push(inlineTokensToText(token.tokens));
      }
      continue;
    }

    if (Array.isArray(token.tokens)) {
      parts.push(inlineTokensToText(token.tokens));
    }
  }
  return parts.join('');
}

function extractTokenText(token: any): string {
  if (!token || typeof token !== 'object') {
    return '';
  }
  if (typeof token.text === 'string') {
    return token.text;
  }
  if (Array.isArray(token.tokens)) {
    return inlineTokensToText(token.tokens);
  }
  return '';
}

function parseMarkdownTokens(markdown: string): any[] {
  try {
    return marked.lexer(markdown) as any[];
  } catch {
    return markdown
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ type: 'paragraph', text: line }));
  }
}

async function embedFonts(pdfDoc: PDFDocument): Promise<EmbeddedFonts> {
  if (!fs.existsSync(REGULAR_FONT_PATH)) {
    throw new Error(`font-not-found: ${REGULAR_FONT_PATH}`);
  }

  const regularBytes = fs.readFileSync(REGULAR_FONT_PATH);
  const regular = await pdfDoc.embedFont(regularBytes, { subset: true });

  if (!fs.existsSync(BOLD_FONT_PATH)) {
    return { regular, heading: regular };
  }

  try {
    const boldBytes = fs.readFileSync(BOLD_FONT_PATH);
    const heading = await pdfDoc.embedFont(boldBytes, { subset: true });
    return { regular, heading };
  } catch {
    return { regular, heading: regular };
  }
}

function drawHeaderFooter(page: PDFPage, font: PDFFont, pageIndex: number, totalPages: number, dateText: string): void {
  const headerY = A4_HEIGHT - 30;
  const footerY = 25;
  const textSize = TYPESET.fontSize.headerFooter;

  const leftHeader = '不動產仲介';
  page.drawText(leftHeader, {
    x: TYPESET.margin.left,
    y: headerY,
    size: textSize,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  const pageLabel = `第 ${pageIndex + 1} 頁 / 共 ${totalPages} 頁`;
  const pageLabelWidth = font.widthOfTextAtSize(pageLabel, textSize);
  page.drawText(pageLabel, {
    x: A4_WIDTH - TYPESET.margin.right - pageLabelWidth,
    y: headerY,
    size: textSize,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  const footer = `製表日期：${dateText} | ⚠ 本文件由 AI 輔助產出，請務必確認內容正確後再使用。`;
  const footerWidth = font.widthOfTextAtSize(footer, textSize);
  page.drawText(footer, {
    x: (A4_WIDTH - footerWidth) / 2,
    y: footerY,
    size: textSize,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
}

function splitLabelValue(line: string): { label: string; value: string } | null {
  const match = line.match(/^([^：:\n]+)\s*[：:]\s*(.+)$/);
  if (!match) {
    return null;
  }
  return {
    label: match[1].trim(),
    value: match[2].trim(),
  };
}

export async function generateDossierPDFLib(
  markdown: string,
  listingId: number | string,
  input?: DocumentGeneratorInput
): Promise<Uint8Array> {
  const listingNum = Number(listingId);
  if (!Number.isInteger(listingNum)) {
    throw new Error('invalid-listing-id');
  }

  const now = new Date();
  const dateText = formatDate(now);
  const listingRow = getListingRow(listingNum);
  const fieldMap = buildFieldValueMap(listingNum, input, listingRow, now);

  const backgroundSetting = readBackgroundSetting();
  const [coverBgBytes, contentBgBytes] = await Promise.all([
    loadBackgroundBytes(backgroundSetting.cover),
    loadBackgroundBytes(backgroundSetting.content),
  ]);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fonts = await embedFonts(pdfDoc);
  const [coverBgImage, contentBgImage] = await Promise.all([
    embedBackgroundImage(pdfDoc, coverBgBytes),
    embedBackgroundImage(pdfDoc, contentBgBytes),
  ]);

  const createContentPage = (): PDFPage => {
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    drawBackground(page, contentBgImage);
    return page;
  };

  const coverPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  drawBackground(coverPage, coverBgImage);

  const contentFieldPage = createContentPage();
  drawContentFields(contentFieldPage, fonts.regular, fieldMap);

  const contentLeft = TYPESET.margin.left;
  const contentRight = A4_WIDTH - TYPESET.margin.right;
  const contentWidth = contentRight - contentLeft;
  const topStartY = A4_HEIGHT - TYPESET.margin.top - TYPESET.fontSize.body;
  const contentBottomY = TYPESET.margin.bottom;
  const bodyFontSize = TYPESET.fontSize.body;
  const lineHeight = TYPESET.fontSize.body * TYPESET.lineHeight;

  const state: RenderState = {
    page: createContentPage(),
    cursorY: topStartY,
  };

  const ensureSpace = (required: number): void => {
    if (state.cursorY - required < contentBottomY) {
      state.page = createContentPage();
      state.cursorY = topStartY;
    }
  };

  const drawParagraphLines = (lines: string[]): void => {
    for (const line of lines) {
      ensureSpace(lineHeight);
      if (line.length > 0) {
        state.page.drawText(line, {
          x: contentLeft,
          y: state.cursorY,
          size: bodyFontSize,
          font: fonts.regular,
          color: rgb(0.1, 0.1, 0.1),
        });
      }
      state.cursorY -= lineHeight;
    }
    ensureSpace(TYPESET.paragraphSpacing);
    state.cursorY -= TYPESET.paragraphSpacing;
  };

  const drawLabelValueLine = (label: string, value: string): void => {
    const labelSize = TYPESET.fontSize.label;
    const labelText = truncateToWidth(label, TYPESET.labelWidth, fonts.regular, labelSize);
    const valueX = contentLeft + TYPESET.labelWidth;
    const valueWidth = contentWidth - TYPESET.labelWidth;
    const valueLines = wrapLineByWidth(value, valueWidth, fonts.regular, bodyFontSize);

    ensureSpace(valueLines.length * lineHeight);

    state.page.drawText(labelText, {
      x: contentLeft,
      y: state.cursorY,
      size: labelSize,
      font: fonts.regular,
      color: rgb(0.1, 0.1, 0.1),
    });

    for (let i = 0; i < valueLines.length; i += 1) {
      const line = valueLines[i] || '';
      if (line.length > 0) {
        state.page.drawText(line, {
          x: valueX,
          y: state.cursorY,
          size: bodyFontSize,
          font: fonts.regular,
          color: rgb(0.1, 0.1, 0.1),
        });
      }
      state.cursorY -= lineHeight;
      if (i < valueLines.length - 1) {
        ensureSpace(lineHeight);
      }
    }

    ensureSpace(TYPESET.paragraphSpacing);
    state.cursorY -= TYPESET.paragraphSpacing;
  };

  const drawHeading = (text: string): void => {
    const headingText = text.trim();
    if (!headingText) {
      return;
    }

    const headingLines = wrapLineByWidth(headingText, contentWidth, fonts.heading, TYPESET.fontSize.heading);
    const headingLineHeight = TYPESET.fontSize.heading * TYPESET.lineHeight;
    const required = 18 + headingLines.length * headingLineHeight + 12;
    ensureSpace(required);

    state.cursorY -= 18;
    for (const line of headingLines) {
      const width = fonts.heading.widthOfTextAtSize(line, TYPESET.fontSize.heading);
      const x = contentLeft + Math.max(0, (contentWidth - width) / 2);
      state.page.drawText(line, {
        x,
        y: state.cursorY,
        size: TYPESET.fontSize.heading,
        font: fonts.heading,
        color: rgb(0.08, 0.08, 0.08),
      });
      state.cursorY -= headingLineHeight;
      ensureSpace(0);
    }

    ensureSpace(12);
    state.cursorY -= 12;
  };

  const drawList = (token: any): void => {
    if (!Array.isArray(token.items)) {
      return;
    }

    const bulletX = contentLeft;
    const textX = contentLeft + 18;
    const textWidth = contentWidth - 18;

    for (const item of token.items) {
      const text = extractTokenText(item).trim();
      const lines = wrapLineByWidth(text, textWidth, fonts.regular, bodyFontSize);
      const required = Math.max(lines.length, 1) * lineHeight;
      ensureSpace(required);

      state.page.drawText('•', {
        x: bulletX,
        y: state.cursorY,
        size: bodyFontSize,
        font: fonts.regular,
        color: rgb(0.1, 0.1, 0.1),
      });

      for (const line of lines) {
        if (line.length > 0) {
          state.page.drawText(line, {
            x: textX,
            y: state.cursorY,
            size: bodyFontSize,
            font: fonts.regular,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
        state.cursorY -= lineHeight;
        ensureSpace(0);
      }
    }

    ensureSpace(TYPESET.paragraphSpacing);
    state.cursorY -= TYPESET.paragraphSpacing;
  };

  const tokens = parseMarkdownTokens(markdown);
  for (const token of tokens) {
    const tokenType = token?.type;

    if (tokenType === 'hr') {
      continue;
    }

    if (tokenType === 'space') {
      ensureSpace(TYPESET.paragraphSpacing);
      state.cursorY -= TYPESET.paragraphSpacing;
      continue;
    }

    if (tokenType === 'heading') {
      drawHeading(extractTokenText(token));
      continue;
    }

    if (tokenType === 'list') {
      drawList(token);
      continue;
    }

    if (tokenType === 'paragraph' || tokenType === 'text') {
      const paragraph = extractTokenText(token);
      const paragraphs = paragraph
        .split('\n')
        .map((line: string) => line.trim())
        .filter(Boolean);

      for (const line of paragraphs) {
        const labelValue = splitLabelValue(line);
        if (labelValue) {
          drawLabelValueLine(labelValue.label, labelValue.value);
          continue;
        }
        drawParagraphLines(wrapLineByWidth(line, contentWidth, fonts.regular, bodyFontSize));
      }
      continue;
    }
  }

  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i += 1) {
    drawHeaderFooter(pages[i], fonts.regular, i, pages.length, dateText);
  }

  return await pdfDoc.save();
}
