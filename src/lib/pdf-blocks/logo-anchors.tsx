import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";

export const PDF_LOGO_BOX_WIDTH_MM = 80;
export const PDF_LOGO_BOX_HEIGHT_MM = 30;

const PLACEHOLDER_TEXT = "（未設定 LOGO）";

function mmToPt(mm: number): number {
  return (mm / 25.4) * 72;
}

export interface PdfHeaderWithLogoProps {
  logoDataUrl?: string;
  themeId?: string;
}

export function PdfHeaderWithLogo({ logoDataUrl }: PdfHeaderWithLogoProps): React.ReactElement {
  const width = mmToPt(PDF_LOGO_BOX_WIDTH_MM);
  const height = mmToPt(PDF_LOGO_BOX_HEIGHT_MM);

  return (
    <View
      fixed
      style={{
        position: "absolute",
        top: 24,
        left: 24,
        right: 24,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width,
          height,
          borderWidth: 1,
          borderColor: "#D1D5DB",
          borderStyle: "solid",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F9FAFB",
          overflow: "hidden",
        }}
      >
        {logoDataUrl ? (
          <Image
            src={logoDataUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          <Text style={{ fontSize: 10, color: "#9CA3AF" }}>{PLACEHOLDER_TEXT}</Text>
        )}
      </View>
      <Text style={{ fontSize: 10, color: "#6B7280" }}>AIRE</Text>
    </View>
  );
}

