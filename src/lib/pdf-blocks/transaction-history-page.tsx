import React from "react";
import { Page, View, Text } from "@react-pdf/renderer";

interface TransactionRecord {
  address: string;
  areaPing: number;
  totalPrice: number;
  unitPrice: number;
  transactionDate: string;
}

interface TransactionHistoryPageProps {
  data: TransactionRecord[];
}

const PAGE_STYLE = {
  paddingTop: 36,
  paddingBottom: 48,
  paddingHorizontal: 40,
  fontFamily: "NotoSansTC",
  fontSize: 10,
} as const;

const ROWS_PER_PAGE = 15;

const COL_WIDTHS = {
  address: "35%",
  areaPing: "15%",
  totalPrice: "15%",
  unitPrice: "20%",
  transactionDate: "15%",
};

function TableHeader() {
  return (
    <View style={{ flexDirection: "row", backgroundColor: "#F3F4F6", borderBottomWidth: 1, borderBottomColor: "#D1D5DB", borderBottomStyle: "solid" }}>
      <Text style={{ width: COL_WIDTHS.address, padding: 6, fontWeight: "bold" }}>地址</Text>
      <Text style={{ width: COL_WIDTHS.areaPing, padding: 6, fontWeight: "bold", textAlign: "right" }}>面積(坪)</Text>
      <Text style={{ width: COL_WIDTHS.totalPrice, padding: 6, fontWeight: "bold", textAlign: "right" }}>總價(萬)</Text>
      <Text style={{ width: COL_WIDTHS.unitPrice, padding: 6, fontWeight: "bold", textAlign: "right" }}>單價(萬/坪)</Text>
      <Text style={{ width: COL_WIDTHS.transactionDate, padding: 6, fontWeight: "bold", textAlign: "center" }}>交易日期</Text>
    </View>
  );
}

export function TransactionHistoryPage({ data }: TransactionHistoryPageProps): React.ReactElement {
  if (!data || data.length === 0) {
    return (
      <Page size="A4" style={PAGE_STYLE}>
        <Text style={{ fontSize: 14, marginBottom: 16 }}>透明房價一覽表</Text>
        <Text style={{ color: "#6B7280" }}>查無成交紀錄</Text>
      </Page>
    );
  }

  const pages: TransactionRecord[][] = [];
  for (let i = 0; i < data.length; i += ROWS_PER_PAGE) {
    pages.push(data.slice(i, i + ROWS_PER_PAGE));
  }

  return (
    <>
      {pages.map((pageRows, pageIndex) => (
        <Page key={pageIndex} size="A4" style={PAGE_STYLE}>
          <Text style={{ fontSize: 14, marginBottom: 12 }}>透明房價一覽表</Text>
          <View style={{ borderWidth: 1, borderColor: "#D1D5DB", borderStyle: "solid" }}>
            <TableHeader />
            {pageRows.map((row, rowIndex) => (
              <View
                key={rowIndex}
                style={{
                  flexDirection: "row",
                  borderBottomWidth: rowIndex === pageRows.length - 1 ? 0 : 1,
                  borderBottomColor: "#E5E7EB",
                  borderBottomStyle: "solid",
                  backgroundColor: rowIndex % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                }}
              >
                <Text style={{ width: COL_WIDTHS.address, padding: 5, fontSize: 9 }}>{row.address}</Text>
                <Text style={{ width: COL_WIDTHS.areaPing, padding: 5, fontSize: 9, textAlign: "right" }}>
                  {row.areaPing > 0 ? row.areaPing.toFixed(2) : "—"}
                </Text>
                <Text style={{ width: COL_WIDTHS.totalPrice, padding: 5, fontSize: 9, textAlign: "right" }}>
                  {row.totalPrice > 0 ? row.totalPrice.toLocaleString("zh-TW") : "—"}
                </Text>
                <Text style={{ width: COL_WIDTHS.unitPrice, padding: 5, fontSize: 9, textAlign: "right" }}>
                  {row.unitPrice > 0 ? row.unitPrice.toLocaleString("zh-TW") : "—"}
                </Text>
                <Text style={{ width: COL_WIDTHS.transactionDate, padding: 5, fontSize: 9, textAlign: "center" }}>
                  {row.transactionDate || "—"}
                </Text>
              </View>
            ))}
          </View>
          {pages.length > 1 && (
            <Text style={{ fontSize: 8, color: "#9CA3AF", marginTop: 8, textAlign: "right" }}>
              第 {pageIndex + 1} 頁，共 {pages.length} 頁
            </Text>
          )}
        </Page>
      ))}
    </>
  );
}
