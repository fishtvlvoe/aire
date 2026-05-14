import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";

export interface LocationMapPageProps {
  logo?: string;
}

export function LocationMapPage({ logo }: LocationMapPageProps): React.ReactElement {
  const { tokens } = useTheme();
  const headingColor = tokens.colors?.primary ?? tokens.primaryColor;
  const textColor = tokens.colors?.text ?? tokens.textColor ?? "#111827";
  const borderColor = tokens.colors?.border ?? tokens.borderColor ?? "#E5E7EB";

  return (
    <Page size="A4" style={{ padding: 24, paddingTop: 120 }}>
      <PdfHeaderWithLogo logoDataUrl={logo} />
      <Text style={{ fontSize: 20, marginBottom: 16, color: headingColor }}>位置圖</Text>
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
        <Text style={{ color: textColor }}>（地圖圖資待插入）</Text>
      </View>
      <PageFooter />
    </Page>
  );
}

