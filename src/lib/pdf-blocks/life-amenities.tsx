import React from "react";
import { Image, Page, Text, View } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";
import { uint8ToDataUrl } from "./image-data-url";

export interface NearbyAmenity {
  name: string;
  category: string;
  distanceM: number;
  address: string;
}

export interface LifeAmenitiesPageProps {
  logo?: string;
  nearbyAmenities?: NearbyAmenity[];
  locationMapImage?: Uint8Array | null;
}

const PRINT_AMENITY_LIMITS: Record<string, number> = {
  學校: 10,
  醫療: 3,
  醫院: 3,
  公園: 1,
  捷運: 1,
  市場: 2,
};

export function compactLifeAmenitiesForPrint(items: NearbyAmenity[]): NearbyAmenity[] {
  const counts = new Map<string, number>();
  return [...items]
    .sort((a, b) => a.distanceM - b.distanceM)
    .filter((item) => {
      const limit = PRINT_AMENITY_LIMITS[item.category] ?? 0;
      if (limit === 0) return false;
      const count = counts.get(item.category) ?? 0;
      if (count >= limit) return false;
      counts.set(item.category, count + 1);
      return true;
    });
}

export function LifeAmenitiesPage({
  logo,
  nearbyAmenities = [],
  locationMapImage = null,
}: LifeAmenitiesPageProps): React.ReactElement {
  const { tokens } = useTheme();
  const headingColor = tokens.colors?.primary ?? tokens.primaryColor;
  const textColor = tokens.colors?.text ?? tokens.textColor ?? "#111827";
  const borderColor = tokens.colors?.border ?? tokens.borderColor ?? "#E5E7EB";
  const hasImage = locationMapImage && locationMapImage.length > 0;

  const printAmenities = compactLifeAmenitiesForPrint(nearbyAmenities ?? []);

  if (printAmenities.length === 0) {
    return (
      <Page size="A4" style={{ padding: 24, paddingTop: 120, fontFamily: "NotoSansTC" }}>
        <PdfHeaderWithLogo logoDataUrl={logo} />
        <Text style={{ fontSize: 20, marginBottom: 16, color: headingColor, fontFamily: "NotoSansTC" }}>位置圖與生活機能</Text>
        <MapBlock
          borderColor={borderColor}
          hasImage={Boolean(hasImage)}
          image={locationMapImage}
          textColor={textColor}
        />
        <Text style={{ color: "#9CA3AF", fontSize: 12, fontFamily: "NotoSansTC" }}>尚未查詢周邊設施</Text>
        <PageFooter />
      </Page>
    );
  }

  // 按 category 分組
  const grouped = new Map<string, NearbyAmenity[]>();
  for (const amenity of printAmenities) {
    const group = grouped.get(amenity.category) ?? [];
    group.push(amenity);
    grouped.set(amenity.category, group);
  }

  return (
    <Page size="A4" style={{ padding: 24, paddingTop: 120, fontFamily: "NotoSansTC" }}>
      <PdfHeaderWithLogo logoDataUrl={logo} />
      <Text style={{ fontSize: 18, marginBottom: 10, color: headingColor, fontFamily: "NotoSansTC" }}>位置圖與生活機能</Text>
      <MapBlock
        borderColor={borderColor}
        hasImage={Boolean(hasImage)}
        image={locationMapImage}
        textColor={textColor}
      />
      {Array.from(grouped.entries()).map(([category, items]) => (
        <View key={category} style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "bold", color: headingColor, marginBottom: 3, fontFamily: "NotoSansTC" }}>
            {category}
          </Text>
          <View style={{ borderWidth: 1, borderStyle: "solid", borderColor, fontFamily: "NotoSansTC" }}>
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
                <Text style={{ flex: 2, padding: 4, color: textColor, fontSize: 8, fontFamily: "NotoSansTC" }}>{item.name}</Text>
                <Text style={{ width: 58, padding: 4, color: textColor, fontSize: 8, textAlign: "right", fontFamily: "NotoSansTC" }}>
                  {Math.round(item.distanceM)} m
                </Text>
                <Text style={{ flex: 3, padding: 4, color: textColor, fontSize: 8, fontFamily: "NotoSansTC" }}>{item.address || "-"}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
      <PageFooter />
    </Page>
  );
}

function MapBlock({
  borderColor,
  hasImage,
  image,
  textColor,
}: {
  borderColor: string;
  hasImage: boolean;
  image: Uint8Array | null;
  textColor: string;
}) {
  return (
    <View
      style={{
        height: 180,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F9FAFB",
        marginBottom: 10,
        fontFamily: "NotoSansTC",
      }}
    >
      {hasImage && image ? (
        <Image style={{ width: "100%", height: 180, objectFit: "contain" }} src={uint8ToDataUrl(image)} />
      ) : (
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: textColor, fontSize: 12, fontFamily: "NotoSansTC", marginBottom: 6 }}>
            位置圖
          </Text>
          <Text style={{ color: "#9CA3AF", fontSize: 9, fontFamily: "NotoSansTC" }}>
            自動產生失敗時可手動上傳覆蓋
          </Text>
        </View>
      )}
    </View>
  );
}
