import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";

export interface LifeAmenitiesPageProps {
  logo?: string;
}

const DEFAULT_AMENITIES = [
  "學區與教育資源",
  "交通機能",
  "醫療與公共服務",
  "商圈與採買",
  "休閒與綠地",
];

export function LifeAmenitiesPage({ logo }: LifeAmenitiesPageProps): React.ReactElement {
  const { tokens } = useTheme();
  const headingColor = tokens.colors?.primary ?? tokens.primaryColor;
  const textColor = tokens.colors?.text ?? tokens.textColor ?? "#111827";
  const borderColor = tokens.colors?.border ?? tokens.borderColor ?? "#E5E7EB";

  return (
    <Page size="A4" style={{ padding: 24, paddingTop: 120 }}>
      <PdfHeaderWithLogo logoDataUrl={logo} />
      <Text style={{ fontSize: 20, marginBottom: 16, color: headingColor }}>生活機能</Text>
      <View style={{ borderWidth: 1, borderStyle: "solid", borderColor }}>
        {DEFAULT_AMENITIES.map((item, index) => (
          <View
            key={item}
            style={{
              flexDirection: "row",
              borderBottomWidth: index === DEFAULT_AMENITIES.length - 1 ? 0 : 1,
              borderBottomStyle: "solid",
              borderBottomColor: borderColor,
            }}
          >
            <Text style={{ width: 28, padding: 8, color: headingColor }}>{index + 1}.</Text>
            <Text style={{ flex: 1, padding: 8, color: textColor }}>{item}</Text>
          </View>
        ))}
      </View>
      <PageFooter />
    </Page>
  );
}

