import React from "react";
import { Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { PageFooter } from "./page-footer";
import { uint8ToDataUrl } from "./image-data-url";

export interface FloorPlanPhotoPageProps {
  photo: Uint8Array | null;
  title: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 24,
    paddingTop: 120,
    fontFamily: "NotoSansTC",
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
    color: "#111827",
    fontFamily: "NotoSansTC",
  },
  frame: {
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
  placeholderTitle: {
    color: "#111827",
    fontSize: 14,
    fontFamily: "NotoSansTC",
    marginBottom: 8,
  },
  placeholderHint: {
    color: "#9CA3AF",
    fontSize: 10,
    fontFamily: "NotoSansTC",
  },
});

function placeholderForTitle(title: string): string {
  return title === "土地規劃圖" ? "請上傳規劃圖" : "請上傳格局圖";
}

export function FloorPlanPhotoPage({
  photo,
  title,
}: FloorPlanPhotoPageProps): React.ReactElement {
  const hasPhoto = photo && photo.length > 0;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.frame}>
        {hasPhoto ? (
          <Image style={styles.image} src={uint8ToDataUrl(photo)} />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.placeholderTitle}>{title}</Text>
            <Text style={styles.placeholderHint}>{placeholderForTitle(title)}</Text>
          </View>
        )}
      </View>
      <PageFooter />
    </Page>
  );
}
