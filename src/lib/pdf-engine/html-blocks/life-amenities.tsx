import React, { CSSProperties } from "react";
import type { HtmlThemeTokens } from "../html-themes";
import { uint8ToDataUrl } from "@/lib/pdf-blocks/image-data-url";

export interface NearbyAmenity {
  name: string;
  category: string;
  distanceM: number;
  address: string;
}

export interface HtmlLifeAmenitiesProps {
  tokens: HtmlThemeTokens;
  nearbyAmenities?: NearbyAmenity[];
  locationMapImage?: Uint8Array | null;
}

export function HtmlLifeAmenities({
  tokens,
  nearbyAmenities = [],
  locationMapImage = null,
}: HtmlLifeAmenitiesProps): React.ReactElement {
  const rootStyle: CSSProperties = {
    fontFamily: tokens.fontFamily,
    color: tokens.text,
  };

  const headingStyle: CSSProperties = {
    fontSize: "20px",
    marginBottom: "12px",
    color: tokens.primary,
    fontFamily: tokens.fontFamily,
  };

  const emptyStyle: CSSProperties = {
    color: tokens.textMuted,
    fontSize: "12px",
    fontFamily: tokens.fontFamily,
  };

  const mapBoxStyle: CSSProperties = {
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    border: `1px solid ${tokens.border}`,
    display: "flex",
    height: "260px",
    justifyContent: "center",
    marginBottom: "14px",
    overflow: "hidden",
  };

  const resolvedMapSrc =
    locationMapImage && locationMapImage.length > 0 ? uint8ToDataUrl(locationMapImage) : null;

  const mapBlock = (
    <div style={mapBoxStyle}>
      {resolvedMapSrc ? (
        <img
          alt="位置圖"
          src={resolvedMapSrc}
          style={{ height: "260px", objectFit: "contain", width: "100%" }}
        />
      ) : (
        <div style={{ textAlign: "center" }}>
          <p style={{ color: tokens.text, fontSize: "12px", marginBottom: "6px" }}>位置圖</p>
          <p style={{ color: tokens.textMuted, fontSize: "9px" }}>自動產生失敗時可手動上傳覆蓋</p>
        </div>
      )}
    </div>
  );

  // 空資料狀態
  if (!nearbyAmenities || nearbyAmenities.length === 0) {
    return (
      <div style={rootStyle}>
        <p style={headingStyle}>位置圖與生活機能</p>
        {mapBlock}
        <span style={emptyStyle}>尚未查詢周邊設施</span>
      </div>
    );
  }

  // 按 category 分組
  const grouped = new Map<string, NearbyAmenity[]>();
  for (const amenity of nearbyAmenities) {
    const group = grouped.get(amenity.category) ?? [];
    group.push(amenity);
    grouped.set(amenity.category, group);
  }

  const categoryHeadingStyle: CSSProperties = {
    fontSize: "12px",
    fontWeight: "bold",
    color: tokens.primary,
    marginBottom: "4px",
    fontFamily: tokens.fontFamily,
  };

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    border: `1px solid ${tokens.border}`,
    fontFamily: tokens.fontFamily,
    fontSize: "9px",
  };

  const cellBase: CSSProperties = {
    padding: "6px",
    color: tokens.text,
    fontSize: "9px",
    fontFamily: tokens.fontFamily,
    verticalAlign: "middle",
  };

  return (
    <div style={rootStyle}>
      <p style={headingStyle}>位置圖與生活機能</p>
      {mapBlock}
      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category} style={{ marginBottom: "12px" }}>
          <p style={categoryHeadingStyle}>{category}</p>
          <table style={tableStyle}>
            <tbody>
              {items.map((item, index) => {
                const rowStyle: CSSProperties = {
                  borderBottom:
                    index === items.length - 1
                      ? "none"
                      : `1px solid ${tokens.border}`,
                };
                return (
                  <tr key={index} style={rowStyle}>
                    {/* 名稱：flex 2 ≈ 佔比 ~50% */}
                    <td style={{ ...cellBase, width: "50%" }}>{item.name}</td>
                    {/* 距離：固定 60px */}
                    <td style={{ ...cellBase, width: "60px", textAlign: "right" }}>
                      {Math.round(item.distanceM)} m
                    </td>
                    {/* 地址：flex 3 ≈ 剩餘空間 */}
                    <td style={{ ...cellBase }}>{item.address || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
