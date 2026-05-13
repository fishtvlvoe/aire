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

type GeoJsonFeatureLike = {
  properties?: unknown;
};

type GeoJsonResponseLike = {
  features?: unknown;
};

const REQUEST_TIMEOUT_MS = 10_000;
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function withTimeoutSignal(timeoutMs: number): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeoutId),
  };
}

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
  const { signal, cleanup } = withTimeoutSignal(REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
      },
      signal,
    });

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
  } finally {
    cleanup();
  }
}

async function lookupByParcel(parcelNumber: string): Promise<LookupResult | null> {
  const trimmed = parcelNumber.trim();
  if (!trimmed) return null;

  const escapedParcel = trimmed.replace(/'/g, "''");
  const cqlFilter = `parcelNo='${escapedParcel}'`;
  const url =
    `https://wfs.nlsc.gov.tw/wfs?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=Land` +
    `&CQL_FILTER=${encodeURIComponent(cqlFilter)}&outputFormat=application/json`;
  const { signal, cleanup } = withTimeoutSignal(REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": BROWSER_USER_AGENT,
      },
      signal,
    });

    if (!response.ok) {
      console.warn(`[lookupByParcel] request failed with status ${response.status}`);
      return null;
    }

    let parsedJson: unknown;
    try {
      parsedJson = await response.json();
    } catch {
      console.warn("[lookupByParcel] invalid JSON response");
      return null;
    }

    const maybeFeatures =
      parsedJson && typeof parsedJson === "object"
        ? (parsedJson as GeoJsonResponseLike).features
        : undefined;
    const features = Array.isArray(maybeFeatures) ? maybeFeatures : [];

    if (!features.length) {
      console.warn("[lookupByParcel] no features found");
      return null;
    }

    const firstFeature = features[0];
    const properties =
      firstFeature && typeof firstFeature === "object"
        ? (firstFeature as GeoJsonFeatureLike).properties
        : undefined;

    if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
      console.warn("[lookupByParcel] missing feature properties");
      return null;
    }

    const data = Object.fromEntries(
      Object.entries(properties as Record<string, unknown>).map(([key, value]) => [key, String(value ?? "")]),
    );

    return {
      source: "NLSC WFS 地籍資料",
      data,
      rawText: JSON.stringify(parsedJson),
    };
  } catch {
    console.warn("[lookupByParcel] lookup failed");
    return null;
  } finally {
    cleanup();
  }
}

export async function lookupPreCommissionData(params: {
  address: string;
  parcelNumber?: string;
}): Promise<LookupReport> {
  const [realPrice, cadastral] = await Promise.all([
    lookupRealPrice(params.address),
    params.parcelNumber ? lookupByParcel(params.parcelNumber) : Promise.resolve(null),
  ]);

  return {
    realPrice,
    cadastral,
    timestamp: new Date().toISOString(),
  };
}
