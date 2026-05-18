import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";

const styles = StyleSheet.create({
  placeholder: {
    height: 430,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
    fontFamily: "NotoSansTC",
  },
  image: {
    width: "100%",
    height: 430,
    objectFit: "contain",
  },
});

export interface AerialPhotoPageProps {
  aerialPhoto?: Uint8Array | null;
  logo?: string;
}

export function AerialPhotoPage({
  aerialPhoto,
  logo,
}: AerialPhotoPageProps): React.ReactElement {
  const { tokens } = useTheme();
  const headingColor = tokens.colors?.primary ?? tokens.primaryColor;
  const textColor = tokens.colors?.text ?? tokens.textColor ?? "#111827";

  return (
    <Page size="A4" style={{ padding: 24, paddingTop: 120, fontFamily: "NotoSansTC" }}>
      <PdfHeaderWithLogo logoDataUrl={logo} />
      <Text style={{ fontSize: 20, marginBottom: 16, color: headingColor, fontFamily: "NotoSansTC" }}>
        航拍位置圖
      </Text>
      <View style={styles.placeholder}>
        {aerialPhoto && aerialPhoto.length > 0 ? (
          <Image
            style={styles.image}
            src={{ data: Buffer.from(aerialPhoto), format: "png" as const }}
          />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: textColor, fontSize: 14, fontFamily: "NotoSansTC", marginBottom: 8 }}>
              航拍圖資料取得中
            </Text>
            <Text style={{ color: "#9CA3AF", fontSize: 10, fontFamily: "NotoSansTC" }}>
              正在從政府圖資服務取得...
            </Text>
          </View>
        )}
      </View>
      <PageFooter />
    </Page>
  );
}
