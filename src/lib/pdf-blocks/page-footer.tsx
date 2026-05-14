import React from "react";
import { Text, View } from "@react-pdf/renderer";
import { useTheme } from "../pdf-themes/theme-provider";

export function PageFooter(): React.ReactElement {
  const { tokens } = useTheme();
  const textColor = tokens.colors?.secondary ?? tokens.secondaryColor ?? "#6B7280";
  const borderColor = tokens.colors?.border ?? tokens.borderColor ?? "#E5E7EB";

  return (
    <View
      fixed
      style={{
        position: "absolute",
        bottom: 20,
        left: 24,
        right: 24,
        borderTopWidth: 1,
        borderTopStyle: "solid",
        borderTopColor: borderColor,
        paddingTop: 6,
      }}
    >
      <Text
        style={{ textAlign: "center", fontSize: 10, color: textColor }}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} / ${totalPages} | 第 ${pageNumber} 頁`
        }
      />
    </View>
  );
}
