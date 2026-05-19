import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";

function uint8ToDataUrl(bytes: Uint8Array): string {
  const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8;
  const mime = isJpeg ? "image/jpeg" : "image/png";
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:${mime};base64,${btoa(binary)}`;
}

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

export interface ExteriorPhotoPageProps {
  exteriorPhoto?: Uint8Array | null;
  logo?: string;
}

export function ExteriorPhotoPage({
  exteriorPhoto,
  logo,
}: ExteriorPhotoPageProps): React.ReactElement {
  const { tokens } = useTheme();
  const headingColor = tokens.colors?.primary ?? tokens.primaryColor;
  const textColor = tokens.colors?.text ?? tokens.textColor ?? "#111827";

  return (
    <Page size="A4" style={{ padding: 24, paddingTop: 120, fontFamily: "NotoSansTC" }}>
      <PdfHeaderWithLogo logoDataUrl={logo} />
      <Text style={{ fontSize: 20, marginBottom: 16, color: headingColor, fontFamily: "NotoSansTC" }}>
        建物外觀
      </Text>
      <View style={styles.placeholder}>
        {exteriorPhoto && exteriorPhoto.length > 0 ? (
          <Image
            style={styles.image}
            src={uint8ToDataUrl(exteriorPhoto)}
          />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Text style={{ color: textColor, fontSize: 14, fontFamily: "NotoSansTC", marginBottom: 8 }}>
              建物外觀
            </Text>
            <Text style={{ color: "#9CA3AF", fontSize: 10, fontFamily: "NotoSansTC" }}>
              請於現場拍攝後上傳
            </Text>
          </View>
        )}
      </View>
      <PageFooter />
    </Page>
  );
}
