import React from "react";
import { Image, Page, Text, View } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";
import { PageFooter } from "./page-footer";
import { PdfHeaderWithLogo } from "./logo-anchors";

export type Photo = string | { src: string };

export interface PhotoGalleryProps {
  photos: Photo[];
  logo?: string;
}

const PHOTOS_PER_PAGE = 4;

function normalizePhoto(photo: Photo): string | undefined {
  return typeof photo === "string" ? photo : photo.src;
}

function chunkPhotos<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

export function PhotoGallery({ photos, logo }: PhotoGalleryProps): React.ReactElement {
  const { tokens } = useTheme();
  const pages = chunkPhotos(photos, PHOTOS_PER_PAGE);
  const borderColor = tokens.colors?.border ?? tokens.borderColor ?? "#E5E7EB";
  const headingColor = tokens.colors?.primary ?? tokens.primaryColor;
  const pagePadding = 24;

  return (
    <>
      {pages.map((pagePhotos, pageIndex) => {
        const cells: (string | undefined)[] = [...pagePhotos.map(normalizePhoto)];
        while (cells.length < PHOTOS_PER_PAGE) cells.push(undefined);

        return (
          <Page key={`photo-page-${pageIndex}`} size="A4" style={{ padding: pagePadding, paddingTop: 120 }} wrap>
            <PdfHeaderWithLogo logoDataUrl={logo} />
            <Text style={{ fontSize: 20, color: headingColor, marginBottom: 14 }}>現場照片</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
              {cells.map((src, cellIndex) => (
                <View
                  key={`photo-cell-${pageIndex}-${cellIndex}`}
                  style={{
                    width: "50%",
                    padding: 4,
                  }}
                >
                  <View
                    style={{
                      height: 260,
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#F9FAFB",
                      overflow: "hidden",
                    }}
                  >
                    {src ? (
                      <Image src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <View />
                    )}
                  </View>
                </View>
              ))}
            </View>
            <PageFooter />
          </Page>
        );
      })}
    </>
  );
}

