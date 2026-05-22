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
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
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
          <View style={{ alignItems: "center" }} />
        )}
      </View>
      <PageFooter />
    </Page>
  );
}
