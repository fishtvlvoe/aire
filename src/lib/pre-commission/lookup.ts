export type LookupResult = {
  source: string;
  data: Record<string, string>;
  rawText?: string;
};

export type LookupReport = {
  realPrice: LookupResult | null;
  cadastral: LookupResult | null;
  timestamp: string;
};

type RealPriceRow = {
  addr?: string;
  price?: string | number;
  unit_price?: string | number;
  build_case?: string;
  floor_desc?: string;
};

function toRecord(rows: RealPriceRow[]): Record<string, string> {
  const data: Record<string, string> = {};

  rows.forEach((row, index) => {
    const i = String(index + 1);
    data[`record_${i}_addr`] = row.addr ? String(row.addr) : "";
    data[`record_${i}_price`] = row.price !== undefined ? String(row.price) : "";
    data[`record_${i}_unit_price`] = row.unit_price !== undefined ? String(row.unit_price) : "";
    data[`record_${i}_build_case`] = row.build_case ? String(row.build_case) : "";
    data[`record_${i}_floor_desc`] = row.floor_desc ? String(row.floor_desc) : "";
  });

  data.record_count = String(rows.length);

  return data;
}

async function lookupRealPrice(address: string): Promise<LookupResult | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  const escapedAddress = trimmed.replace(/'/g, "''");
  const filter = `contains(addr,'${escapedAddress}')`;
  const url = `https://lvr.land.moi.gov.tw/od/table/RealPrice?$format=json&$filter=${encodeURIComponent(filter)}&$top=5`;

  try {
    const response = await fetch(url, { method: "GET" });
    if (!response.ok) return null;

    const text = await response.text();
    let parsedJson: unknown;

    try {
      parsedJson = JSON.parse(text);
    } catch {
      return null;
    }

    const rawRows = Array.isArray(parsedJson)
      ? parsedJson
      : parsedJson && typeof parsedJson === "object" && Array.isArray((parsedJson as { value?: unknown[] }).value)
        ? (parsedJson as { value: unknown[] }).value
        : [];

    const rows = rawRows
      .filter((row): row is RealPriceRow => typeof row === "object" && row !== null)
      .slice(0, 5)
      .map((row) => ({
        addr: row.addr,
        price: row.price,
        unit_price: row.unit_price,
        build_case: row.build_case,
        floor_desc: row.floor_desc,
      }));

    if (!rows.length) return null;

    return {
      source: "內政部實價登錄 Open Data",
      data: toRecord(rows),
      rawText: text,
    };
  } catch {
    return null;
  }
}

async function lookupCadastral(parcelNumber: string): Promise<LookupResult | null> {
  if (!parcelNumber.trim()) return null;
  console.warn("地籍查詢暫未實作");
  // TODO: Implement NLSC WFS XML parsing.
  return null;
}

export async function lookupPreCommissionData(params: {
  address: string;
  parcelNumber?: string;
}): Promise<LookupReport> {
  const [realPrice, cadastral] = await Promise.all([
    lookupRealPrice(params.address),
    params.parcelNumber ? lookupCadastral(params.parcelNumber) : Promise.resolve(null),
  ]);

  return {
    realPrice,
    cadastral,
    timestamp: new Date().toISOString(),
  };
}
