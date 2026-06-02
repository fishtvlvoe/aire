import { describe, expect, it } from "vitest";

import {
  compactTransactionHistoryRows,
  type TransactionRecord,
} from "../transaction-history-page";

describe("TransactionHistoryPage print data", () => {
  it("prints only the latest 10 rows so the market table stays on one page", () => {
    const rows: TransactionRecord[] = Array.from({ length: 15 }, (_, index) => ({
      address: `台南市東區裕農路${index + 1}號`,
      areaPing: 25 + index,
      totalPrice: 800 + index,
      unitPrice: 30 + index,
      transactionDate: `2025-12-${String(index + 1).padStart(2, "0")}`,
    }));

    const result = compactTransactionHistoryRows(rows);

    expect(result).toHaveLength(10);
    expect(result[0]?.address).toBe("台南市東區裕農路1號");
    expect(result[9]?.address).toBe("台南市東區裕農路10號");
  });
});
