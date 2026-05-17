export interface HtmlThemeTokens {
  primary: string;
  text: string;
  textMuted: string;
  bg: string;
  bgAlt: string;
  border: string;
  fontFamily: string;
}

const THEME_TOKENS: Record<string, HtmlThemeTokens> = {
  "theme-a-minimal": {
    primary: "#3B82F6",
    text: "#111827",
    textMuted: "#6B7280",
    bg: "#FFFFFF",
    bgAlt: "#F9FAFB",
    border: "#E5E7EB",
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif',
  },
  "theme-b-professional": {
    primary: "#1E3A5F",
    text: "#1F2937",
    textMuted: "#6B7280",
    bg: "#FFFFFF",
    bgAlt: "#F3F4F6",
    border: "#C9A961",
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif',
  },
  "theme-c-tech-elegant": {
    primary: "#3B5E7A",
    text: "#1F2937",
    textMuted: "#6B7280",
    bg: "#FFFFFF",
    bgAlt: "#F3F4F6",
    border: "#C9A961",
    fontFamily: '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif',
  },
};

export function getHtmlThemeTokens(themeId: string): HtmlThemeTokens {
  return THEME_TOKENS[themeId] ?? THEME_TOKENS["theme-a-minimal"];
}
