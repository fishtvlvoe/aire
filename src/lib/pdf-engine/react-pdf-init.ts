import { Font } from "@react-pdf/renderer";

const DEFAULT_FONT_ASSET_PATH = "/resources/fonts/NotoSansTC-Subset.ttf";

let initialized = false;
const registeredFamilies = new Set<string>();

function filePathFromUrl(url: URL): string | null {
  if (url.protocol !== "file:") return null;
  let p = url.pathname;
  // Windows file URL pathname often starts with /C:/...
  if (/^\/[A-Za-z]:\//.test(p)) p = p.slice(1);
  return decodeURIComponent(p);
}

function resolveNotoSubsetSrc(): string {
  // Vitest/Node: use an absolute filesystem path so @react-pdf/font uses fs (not fetch).
  const isNode =
    typeof process !== "undefined" &&
    typeof (process as unknown as { versions?: { node?: string } }).versions?.node === "string";
  if (isNode && typeof process.cwd === "function") {
    const cwd = process.cwd();
    if (cwd) return `${cwd.replace(/\/$/, "")}/src/resources/fonts/NotoSansTC-Subset.ttf`;
  }

  // ESM / bundlers: try resolving relative to this module.
  try {
    const url = new URL("../../resources/fonts/NotoSansTC-Subset.ttf", import.meta.url);
    return filePathFromUrl(url) ?? url.toString();
  } catch {
    return DEFAULT_FONT_ASSET_PATH;
  }
}

export function initReactPdfEngine(): void {
  if (initialized) return;
  initialized = true;

  const notoSrc = resolveNotoSubsetSrc();

  // Register NotoSansTC subset (regular + bold same file, allow synthetic bold)
  Font.register({
    family: "NotoSansTC",
    fonts: [
      { src: notoSrc, fontWeight: 400 },
      { src: notoSrc, fontWeight: 700 },
    ],
  });
  registeredFamilies.add("NotoSansTC");

  // Disable hyphenation to keep CJK / long tokens intact
  Font.registerHyphenationCallback((word: string) => [word]);
}

export function getRegisteredFontFamilies(): string[] {
  return [...registeredFamilies];
}
