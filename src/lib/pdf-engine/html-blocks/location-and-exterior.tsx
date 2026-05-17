import React, { CSSProperties } from "react";
import type { HtmlThemeTokens } from "../html-themes";

// ─── 工具函式：Uint8Array → base64 data URL ───────────────────────────────

function uint8ArrayToDataUrl(bytes: Uint8Array, mimeType = "image/jpeg"): string {
  // 瀏覽器環境用 btoa，Node.js 環境用 Buffer
  if (typeof Buffer !== "undefined") {
    return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

// ─── HtmlLocationMap ──────────────────────────────────────────────────────

export interface HtmlLocationMapProps {
  /** 位置圖的 Uint8Array（優先使用） */
  locationMapImage?: Uint8Array | null;
  /** 或直接傳 base64 data URL / 普通 URL */
  imageUrl?: string;
  tokens: HtmlThemeTokens;
}

export function HtmlLocationMap({
  locationMapImage,
  imageUrl,
  tokens,
}: HtmlLocationMapProps): React.ReactElement {
  // 解析圖片來源：Uint8Array > imageUrl > 無圖
  const resolvedSrc: string | null =
    locationMapImage && locationMapImage.length > 0
      ? uint8ArrayToDataUrl(locationMapImage)
      : (imageUrl ?? null);

  const containerStyle: CSSProperties = {
    height: 430,
    border: `1px solid ${tokens.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  };

  const headingStyle: CSSProperties = {
    fontSize: 20,
    marginBottom: 16,
    color: tokens.primary,
    fontFamily: tokens.fontFamily,
    fontWeight: 600,
  };

  const captionStyle: CSSProperties = {
    fontSize: 7,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "right",
    fontFamily: tokens.fontFamily,
  };

  return (
    <div style={{ fontFamily: tokens.fontFamily }}>
      <p style={headingStyle}>位置圖</p>

      <div style={containerStyle}>
        {resolvedSrc ? (
          <img
            src={resolvedSrc}
            alt="位置圖"
            style={{ width: "100%", height: 430, objectFit: "contain" }}
          />
        ) : (
          /* 無圖佔位 */
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                color: tokens.text,
                fontSize: 14,
                fontFamily: tokens.fontFamily,
                marginBottom: 8,
              }}
            >
              位置圖
            </p>
            <p
              style={{
                color: "#9CA3AF",
                fontSize: 10,
                fontFamily: tokens.fontFamily,
                margin: 0,
              }}
            >
              待取得地圖資料後自動填入
            </p>
          </div>
        )}
      </div>

      <p style={captionStyle}>OpenStreetMap contributors</p>
    </div>
  );
}

// ─── HtmlExteriorPhoto ────────────────────────────────────────────────────

export interface HtmlExteriorPhotoProps {
  /** 建物外觀的 Uint8Array（優先使用） */
  exteriorPhoto?: Uint8Array | null;
  /** 或直接傳 base64 data URL / 普通 URL */
  imageUrl?: string;
  tokens: HtmlThemeTokens;
}

export function HtmlExteriorPhoto({
  exteriorPhoto,
  imageUrl,
  tokens,
}: HtmlExteriorPhotoProps): React.ReactElement {
  // 解析圖片來源：Uint8Array > imageUrl > 無圖
  const resolvedSrc: string | null =
    exteriorPhoto && exteriorPhoto.length > 0
      ? uint8ArrayToDataUrl(exteriorPhoto)
      : (imageUrl ?? null);

  const containerStyle: CSSProperties = {
    height: 430,
    border: `1px solid ${tokens.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
  };

  const headingStyle: CSSProperties = {
    fontSize: 20,
    marginBottom: 16,
    color: tokens.primary,
    fontFamily: tokens.fontFamily,
    fontWeight: 600,
  };

  return (
    <div style={{ fontFamily: tokens.fontFamily }}>
      <p style={headingStyle}>建物外觀</p>

      <div style={containerStyle}>
        {resolvedSrc ? (
          <img
            src={resolvedSrc}
            alt="建物外觀"
            style={{ width: "100%", height: 430, objectFit: "contain" }}
          />
        ) : (
          /* 無圖佔位 */
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                color: tokens.text,
                fontSize: 14,
                fontFamily: tokens.fontFamily,
                marginBottom: 8,
              }}
            >
              建物外觀
            </p>
            <p
              style={{
                color: "#9CA3AF",
                fontSize: 10,
                fontFamily: tokens.fontFamily,
                margin: 0,
              }}
            >
              請於現場拍攝後上傳
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
