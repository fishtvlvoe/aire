import React from "react";
import { Page, Text, View, Image } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";

export interface LocationMapPageProps {
  logo?: string;
  locationMapImage?: Uint8Array | null;
}

function uint8ToDataUrl(bytes: Uint8Array): string {
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const mime = isJpeg ? "image/jpeg" : "image/png";
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:${mime};base64,${btoa(binary)}`;
}

export function LocationMapPage({
  logo,
  locationMapImage,
}: LocationMapPageProps): React.ReactElement | null {
  const { tokens } = useTheme();
  const headingColor = tokens.colors?.primary ?? tokens.primaryColor;
  const textColor = tokens.colors?.text ?? tokens.textColor ?? "#111827";
  const borderColor = tokens.colors?.border ?? tokens.borderColor ?? "#E5E7EB";

  // 沒有圖時顯示佔位
  const hasImage = locationMapImage && locationMapImage.length > 0;

  return (
    <Page size="A4" style={{ padding: 24, paddingTop: 120, fontFamily: "NotoSansTC" }}>
      <PdfHeaderWithLogo logoDataUrl={logo} />
      <Text style={{ fontSize: 20, marginBottom: 16, color: headingColor, fontFamily: "NotoSansTC" }}>
        位置圖
      </Text>
      <View
        style={{
          height: 430,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F9FAFB",
          fontFamily: "NotoSansTC",
        }}
      >
        {hasImage ? (
          <Image
            style={{ width: "100%", height: 430, objectFit: "contain" }}
            src={uint8ToDataUrl(locationMapImage!)}
          />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: textColor, fontSize: 14, fontFamily: "NotoSansTC", marginBottom: 8 }}>
              位置圖
            </Text>
            <Text style={{ color: "#9CA3AF", fontSize: 10, fontFamily: "NotoSansTC" }}>
              待取得地圖資料後自動填入
            </Text>
          </View>
        )}
      </View>
      <Text
        style={{ fontSize: 7, color: "#9CA3AF", marginTop: 4, textAlign: "right", fontFamily: "NotoSansTC" }}
      >
        OpenStreetMap contributors
      </Text>
      <PageFooter />
    </Page>
  );
}
