export interface TwnDateParts {
  year: number;
  rocYear: number;
  month: number;
  day: number;
  monthPadded: string;
  dayPadded: string;
}

const TW_TIME_ZONE = "Asia/Taipei";
const INVALID_DATE_FALLBACK = "日期格式錯誤";

function parseDateOnly(iso: string): { year: number; month: number; day: number } | null {
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function toTwDatePartsFromDate(date: Date): { year: number; month: number; day: number } | null {
  if (Number.isNaN(date.getTime())) return null;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TW_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = Number.parseInt(parts.find((part) => part.type === "year")?.value ?? "", 10);
  const month = Number.parseInt(parts.find((part) => part.type === "month")?.value ?? "", 10);
  const day = Number.parseInt(parts.find((part) => part.type === "day")?.value ?? "", 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return { year, month, day };
}

function parseTwnDateParts(iso: string): TwnDateParts | null {
  const dateOnly = parseDateOnly(iso);
  const base = dateOnly ?? toTwDatePartsFromDate(new Date(iso));
  if (!base) return null;
  const rocYear = toRocYear(base.year);
  return {
    year: base.year,
    rocYear,
    month: base.month,
    day: base.day,
    monthPadded: String(base.month).padStart(2, "0"),
    dayPadded: String(base.day).padStart(2, "0"),
  };
}

export function toRocYear(year: number): number {
  if (year <= 1911) {
    throw new RangeError("ROC year must be >= 1 (Western year >= 1912).");
  }
  return year - 1911;
}

export function formatDateTwn(iso: string): string {
  const parts = parseTwnDateParts(iso);
  if (!parts) return INVALID_DATE_FALLBACK;
  return `${parts.year} 年 ${parts.monthPadded} 月 ${parts.dayPadded} 日（民國 ${parts.rocYear} 年 ${parts.monthPadded} 月 ${parts.dayPadded} 日）`;
}

export function formatRocDate(iso: string): string {
  return formatDateTwn(iso);
}

export function formatDateTwnShort(iso: string): string {
  const parts = parseTwnDateParts(iso);
  if (!parts) return INVALID_DATE_FALLBACK;
  return `民國 ${parts.rocYear} 年 ${parts.monthPadded} 月 ${parts.dayPadded} 日`;
}

export function toLocalTwDate(iso: string): string {
  const parts = toTwDatePartsFromDate(new Date(iso));
  if (!parts) return INVALID_DATE_FALLBACK;
  const month = String(parts.month).padStart(2, "0");
  const day = String(parts.day).padStart(2, "0");
  return `${parts.year}-${month}-${day}`;
}
