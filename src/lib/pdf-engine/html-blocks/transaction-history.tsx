import React, { CSSProperties } from "react";
import { HtmlThemeTokens } from "../html-themes";

interface TransactionRecord {
  address: string;
  areaPing: number;
  totalPrice: number;
  unitPrice: number;
  transactionDate: string;
}

interface HtmlTransactionHistoryProps {
  data: TransactionRecord[];
  tokens: HtmlThemeTokens;
}

const ROWS_PER_PAGE = 15;

const COL_WIDTHS = {
  address: "35%",
  areaPing: "15%",
  totalPrice: "15%",
  unitPrice: "20%",
  transactionDate: "15%",
};

function TableHeader({ tokens }: { tokens: HtmlThemeTokens }) {
  const thStyle: CSSProperties = {
    padding: "6px",
    fontWeight: "bold",
    fontSize: "10px",
    fontFamily: tokens.fontFamily,
    color: tokens.text,
    backgroundColor: tokens.bgAlt,
    borderBottom: `1px solid ${tokens.border}`,
    textAlign: "left",
  };

  return (
    <thead>
      <tr>
        <th style={{ ...thStyle, width: COL_WIDTHS.address }}>地址</th>
        <th style={{ ...thStyle, width: COL_WIDTHS.areaPing, textAlign: "right" }}>面積(坪)</th>
        <th style={{ ...thStyle, width: COL_WIDTHS.totalPrice, textAlign: "right" }}>總價(萬)</th>
        <th style={{ ...thStyle, width: COL_WIDTHS.unitPrice, textAlign: "right" }}>單價(萬/坪)</th>
        <th style={{ ...thStyle, width: COL_WIDTHS.transactionDate, textAlign: "center" }}>交易日期</th>
      </tr>
    </thead>
  );
}

export function HtmlTransactionHistory({ data, tokens }: HtmlTransactionHistoryProps): React.ReactElement {
  const pageWrapperStyle: CSSProperties = {
    paddingTop: "36px",
    paddingBottom: "48px",
    paddingLeft: "40px",
    paddingRight: "40px",
    fontFamily: tokens.fontFamily,
    fontSize: "10px",
    backgroundColor: tokens.bg,
    color: tokens.text,
  };

  const titleStyle: CSSProperties = {
    fontSize: "14px",
    marginBottom: "12px",
    fontFamily: tokens.fontFamily,
    color: tokens.text,
    fontWeight: "bold",
  };

  if (!data || data.length === 0) {
    return (
      <div style={pageWrapperStyle}>
        <p style={titleStyle}>附近地段實價登錄成交行情</p>
        <span style={{ color: tokens.textMuted, fontSize: "10px", fontFamily: tokens.fontFamily }}>
          查無成交紀錄
        </span>
      </div>
    );
  }

  // 分頁切割
  const pages: TransactionRecord[][] = [];
  for (let i = 0; i < data.length; i += ROWS_PER_PAGE) {
    pages.push(data.slice(i, i + ROWS_PER_PAGE));
  }

  const tableStyle: CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    border: `1px solid ${tokens.border}`,
  };

  const tdBaseStyle: CSSProperties = {
    padding: "5px",
    fontSize: "9px",
    fontFamily: tokens.fontFamily,
    color: tokens.text,
  };

  const pageFooterStyle: CSSProperties = {
    fontSize: "8px",
    color: tokens.textMuted,
    marginTop: "8px",
    textAlign: "right",
    fontFamily: tokens.fontFamily,
  };

  return (
    <>
      {pages.map((pageRows, pageIndex) => (
        <div key={pageIndex} style={pageWrapperStyle}>
          <p style={titleStyle}>附近地段實價登錄成交行情</p>
          <table style={tableStyle}>
            <TableHeader tokens={tokens} />
            <tbody>
              {pageRows.map((row, rowIndex) => {
                const isLast = rowIndex === pageRows.length - 1;
                const rowBg = rowIndex % 2 === 0 ? tokens.bg : tokens.bgAlt;

                const tdStyle: CSSProperties = {
                  ...tdBaseStyle,
                  borderBottom: isLast ? "none" : `1px solid ${tokens.border}`,
                  backgroundColor: rowBg,
                };

                return (
                  <tr key={rowIndex}>
                    <td style={{ ...tdStyle, width: COL_WIDTHS.address }}>{row.address}</td>
                    <td style={{ ...tdStyle, width: COL_WIDTHS.areaPing, textAlign: "right" }}>
                      {row.areaPing > 0 ? row.areaPing.toFixed(2) : "—"}
                    </td>
                    <td style={{ ...tdStyle, width: COL_WIDTHS.totalPrice, textAlign: "right" }}>
                      {row.totalPrice > 0 ? row.totalPrice.toLocaleString("zh-TW") : "—"}
                    </td>
                    <td style={{ ...tdStyle, width: COL_WIDTHS.unitPrice, textAlign: "right" }}>
                      {row.unitPrice > 0 ? row.unitPrice.toLocaleString("zh-TW") : "—"}
                    </td>
                    <td style={{ ...tdStyle, width: COL_WIDTHS.transactionDate, textAlign: "center" }}>
                      {row.transactionDate || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pages.length > 1 && (
            <p style={pageFooterStyle}>
              第 {pageIndex + 1} 頁，共 {pages.length} 頁
            </p>
          )}
        </div>
      ))}
    </>
  );
}
