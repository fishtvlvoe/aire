import React from "react";
import { Page, Text, View } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";

export interface NearbyAmenity {
  name: string;
  category: string;
  distanceM: number;
  address: string;
}

export interface LifeAmenitiesPageProps {
  logo?: string;
  nearbyAmenities?: NearbyAmenity[];
}

export function LifeAmenitiesPage({ logo, nearbyAmenities = [] }: LifeAmenitiesPageProps): React.ReactElement {
  const { tokens } = useTheme();
  const headingColor = tokens.colors?.primary ?? tokens.primaryColor;
  const textColor = tokens.colors?.text ?? tokens.textColor ?? "#111827";
  const borderColor = tokens.colors?.border ?? tokens.borderColor ?? "#E5E7EB";

  if (!nearbyAmenities || nearbyAmenities.length === 0) {
    return (
      <Page size="A4" style={{ padding: 24, paddingTop: 120 }}>
        <PdfHeaderWithLogo logoDataUrl={logo} />
        <Text style={{ fontSize: 20, marginBottom: 16, color: headingColor }}>生活機能</Text>
        <Text style={{ color: textColor }}>尚未查詢周邊設施</Text>
        <PageFooter />
      </Page>
    );
  }

  // 按 category 分組
  const grouped = new Map<string, NearbyAmenity[]>();
  for (const amenity of nearbyAmenities) {
    const group = grouped.get(amenity.category) ?? [];
    group.push(amenity);
    grouped.set(amenity.category, group);
  }

  return (
    <Page size="A4" style={{ padding: 24, paddingTop: 120 }}>
      <PdfHeaderWithLogo logoDataUrl={logo} />
      <Text style={{ fontSize: 20, marginBottom: 16, color: headingColor }}>生活機能</Text>
      {Array.from(grouped.entries()).map(([category, items]) => (
        <View key={category} style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "bold", color: headingColor, marginBottom: 4 }}>
            {category}
          </Text>
          <View style={{ borderWidth: 1, borderStyle: "solid", borderColor }}>
            {items.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  borderBottomWidth: index === items.length - 1 ? 0 : 1,
                  borderBottomStyle: "solid",
                  borderBottomColor: borderColor,
                }}
              >
                <Text style={{ flex: 2, padding: 6, color: textColor, fontSize: 9 }}>{item.name}</Text>
                <Text style={{ width: 60, padding: 6, color: textColor, fontSize: 9, textAlign: "right" }}>
                  {Math.round(item.distanceM)} m
                </Text>
                <Text style={{ flex: 3, padding: 6, color: textColor, fontSize: 9 }}>{item.address || "—"}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      <PageFooter />
    </Page>
  );
}
