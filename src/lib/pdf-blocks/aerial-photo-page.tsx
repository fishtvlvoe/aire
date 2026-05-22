import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";
import { uint8ToDataUrl } from "./image-data-url";

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
            src={uint8ToDataUrl(aerialPhoto)}
          />
        ) : (
          <View style={{ alignItems: "center" }} />
        )}
      </View>
      <PageFooter />
    </Page>
  );
}
