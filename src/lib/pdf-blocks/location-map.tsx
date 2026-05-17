import React from "react";
import { Page, Text, View, Image } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";

export interface LocationMapPageProps {
  logo?: string;
  locationMapImage?: Uint8Array | null;
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
    <Page size="A4" style={{ padding: 24, paddingTop: 120 }}>
      <PdfHeaderWithLogo logoDataUrl={logo} />
      <Text style={{ fontSize: 20, marginBottom: 16, color: headingColor }}>
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
        }}
      >
        {hasImage ? (
          <Image
            style={{ width: "100%", height: 430, objectFit: "contain" }}
            src={{
              data: Buffer.from(locationMapImage!),
              format: "png" as const,
            }}
          />
        ) : (
          <Text style={{ color: textColor }}>（地圖圖資待插入）</Text>
        )}
      </View>
      <Text
        style={{ fontSize: 7, color: "#9CA3AF", marginTop: 4, textAlign: "right" }}
      >
        © OpenStreetMap contributors
      </Text>
      <PageFooter />
    </Page>
  );
}
