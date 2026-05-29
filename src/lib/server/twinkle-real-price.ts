import type { RealPriceRecord } from "@/lib/real-price-query";

const TWINKLE_ENDPOINT = "https://api.twinkleai.tw/mcp/";
const SQM_TO_PING = 0.3025;

type TwinkleResponsePayload = {
  columns?: string[];
  rows?: unknown[];
  error?: { message?: string };
};

type DatasetConfig = {
  cityName: string;
  datasetId: string;
  orderBy: string;
  sourceLabel: "city-specific" | "national-fallback";
  buildWhereClause: (district: string, keyword: string) => string;
  mapRow: (row: unknown, indexMap: Map<string, number>) => RealPriceRecord | null;
};

export type RealPriceDatasetPlan = {
  cityName: string;
  datasetId: string;
  orderBy: string;
  sourceLabel: "city-specific" | "national-fallback";
};

function escapeSqlLike(value: string): string {
  return value.replace(/'/g, "''");
}

function normalizeTaiwanText(value: string): string {
  return value.replace(/臺/g, "台").trim();
}

function extractCity(address?: string): string {
  if (!address) return "";
  const match = normalizeTaiwanText(address).match(/^(.+?[縣市])/);
  return match?.[1] ?? "";
}

function rocToIsoDate(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 7) return raw.trim();
  const year = Number(digits.slice(0, 3)) + 1911;
  const month = digits.slice(3, 5);
  const day = digits.slice(5, 7);
  return `${year}-${month}-${day}`;
}

function parseSseDataLine(body: string): TwinkleResponsePayload {
  const dataLine = body
    .trim()
    .split("\n")
    .reverse()
    .find((line) => line.startsWith("data: "));

  if (!dataLine) {
    throw new Error("Twinkle MCP response missing data line");
  }

  const outer = JSON.parse(dataLine.slice(6)) as {
    result?: { content?: Array<{ text?: string }> };
  };
  const text = outer.result?.content?.[0]?.text;
  if (!text) {
    throw new Error("Twinkle MCP response missing result content");
  }

  return JSON.parse(text) as TwinkleResponsePayload;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function pickRowValue(row: unknown, indexMap: Map<string, number>, key: string): unknown {
  if (!Array.isArray(row)) return undefined;
  const index = indexMap.get(key);
  return index === undefined ? undefined : row[index];
}

function buildNationalConfig(): DatasetConfig {
  return {
    cityName: "全國",
    datasetId: "lvr-trades",
    orderBy: "iso_trade_date DESC",
    sourceLabel: "national-fallback",
    buildWhereClause: (district, keyword) =>
      `"鄉鎮市區" LIKE '%${escapeSqlLike(district)}%' AND "土地位置建物門牌_半形" LIKE '%${escapeSqlLike(keyword)}%'`,
    mapRow: (row, indexMap) => {
      const address =
        String(pickRowValue(row, indexMap, "土地位置建物門牌") ?? "").trim() ||
        String(pickRowValue(row, indexMap, "土地位置建物門牌_半形") ?? "").trim();
      const areaSqm = toNumber(pickRowValue(row, indexMap, "建物移轉總面積平方公尺"));
      const unitPricePerSqm = toNumber(pickRowValue(row, indexMap, "單價元平方公尺"));
      const totalPrice = toNumber(pickRowValue(row, indexMap, "總價元"));
      const date =
        String(pickRowValue(row, indexMap, "iso_trade_date") ?? "").trim() ||
        String(pickRowValue(row, indexMap, "交易年月日") ?? "").trim();
      const type = String(pickRowValue(row, indexMap, "建物型態") ?? "").trim();

      if (!address || !areaSqm || areaSqm <= 0 || !totalPrice) return null;

      return {
        address,
        total_price: totalPrice,
        area: Math.round(areaSqm * SQM_TO_PING * 10) / 10,
        unit_price: unitPricePerSqm ? Math.round(unitPricePerSqm * (1 / SQM_TO_PING)) : undefined,
        transaction_date: date,
        date,
        type: type || "未分類",
      } satisfies RealPriceRecord;
    },
  };
}

function buildTainanConfig(): DatasetConfig {
  return {
    cityName: "台南市",
    datasetId: "128852",
    orderBy: "交易年月日 DESC",
    sourceLabel: "city-specific",
    buildWhereClause: (district, keyword) =>
      `"鄉鎮市區" LIKE '%${escapeSqlLike(district)}%' AND "土地區段位置或建物區門牌" LIKE '%${escapeSqlLike(keyword)}%'`,
    mapRow: (row, indexMap) => {
      const address = String(pickRowValue(row, indexMap, "土地區段位置或建物區門牌") ?? "").trim();
      const areaSqm = toNumber(pickRowValue(row, indexMap, "建物移轉總面積平方公尺"));
      const unitPricePerSqm = toNumber(pickRowValue(row, indexMap, "單價每平方公尺"));
      const totalPrice = toNumber(pickRowValue(row, indexMap, "總價元"));
      const date = rocToIsoDate(String(pickRowValue(row, indexMap, "交易年月日") ?? "").trim());
      const type = String(pickRowValue(row, indexMap, "建物型態") ?? "").trim();

      if (!address || !areaSqm || areaSqm <= 0 || !totalPrice) return null;

      return {
        address,
        total_price: totalPrice,
        area: Math.round(areaSqm * SQM_TO_PING * 10) / 10,
        unit_price: unitPricePerSqm ? Math.round(unitPricePerSqm * (1 / SQM_TO_PING)) : undefined,
        transaction_date: date,
        date,
        type: type || "未分類",
      } satisfies RealPriceRecord;
    },
  };
}

function buildTaichungConfig(): DatasetConfig {
  return {
    cityName: "台中市",
    datasetId: "103038",
    orderBy: "民國年月 DESC",
    sourceLabel: "city-specific",
    buildWhereClause: (district, keyword) =>
      `"鄉鎮市區" LIKE '%${escapeSqlLike(district)}%' AND "土地區段位置-建物區段門牌" LIKE '%${escapeSqlLike(keyword)}%'`,
    mapRow: (row, indexMap) => {
      const address = String(pickRowValue(row, indexMap, "土地區段位置-建物區段門牌") ?? "").trim();
      const areaSqm = toNumber(pickRowValue(row, indexMap, "建物移轉總面積-平方公尺"));
      const unitPricePerSqm = toNumber(pickRowValue(row, indexMap, "單價-每平方公尺"));
      const totalPrice = toNumber(pickRowValue(row, indexMap, "總價-元"));
      const rocYearMonth = String(pickRowValue(row, indexMap, "民國年月") ?? "").trim();
      const date = rocYearMonth.length === 5
        ? `${Number(rocYearMonth.slice(0, 3)) + 1911}-${rocYearMonth.slice(3, 5)}`
        : rocYearMonth;
      const type = String(pickRowValue(row, indexMap, "建物型態") ?? "").trim();

      if (!address || !areaSqm || areaSqm <= 0 || !totalPrice) return null;

      return {
        address,
        total_price: totalPrice,
        area: Math.round(areaSqm * SQM_TO_PING * 10) / 10,
        unit_price: unitPricePerSqm ? Math.round(unitPricePerSqm * (1 / SQM_TO_PING)) : undefined,
        transaction_date: date,
        date,
        type: type || "未分類",
      } satisfies RealPriceRecord;
    },
  };
}

function buildTaipeiConfig(): DatasetConfig {
  return {
    cityName: "台北市",
    datasetId: "145630",
    orderBy: "SDATE DESC",
    sourceLabel: "city-specific",
    buildWhereClause: (district, keyword) =>
      `"DISTRICT" LIKE '%${escapeSqlLike(district)}%' AND "LOCATION" LIKE '%${escapeSqlLike(keyword)}%' AND "CASE_T" = '買賣'`,
    mapRow: (row, indexMap) => {
      const district = String(pickRowValue(row, indexMap, "DISTRICT") ?? "").trim();
      const location = String(pickRowValue(row, indexMap, "LOCATION") ?? "").trim();
      const address = location ? `台北市${district}${location}` : "";
      const areaPing = toNumber(pickRowValue(row, indexMap, "FAREA"));
      const rawTotalPrice = toNumber(pickRowValue(row, indexMap, "TPRICE"));
      const rawUnitPrice = toNumber(pickRowValue(row, indexMap, "UPRICE"));
      const totalPrice = rawTotalPrice ? (rawTotalPrice < 1_000_000 ? rawTotalPrice * 10_000 : rawTotalPrice) : undefined;
      const unitPrice = rawUnitPrice
        ? (rawUnitPrice > 0 && rawUnitPrice < 100_000 ? Math.round(rawUnitPrice * 10_000) : Math.round(rawUnitPrice))
        : (totalPrice && areaPing ? Math.round(totalPrice / areaPing) : undefined);
      const date = rocToIsoDate(String(pickRowValue(row, indexMap, "SDATE") ?? "").trim());
      const type =
        String(pickRowValue(row, indexMap, "BUITYPE") ?? "").trim() ||
        String(pickRowValue(row, indexMap, "CASE_F") ?? "").trim();

      if (!address || !areaPing || areaPing <= 0 || !totalPrice) return null;

      return {
        address,
        total_price: totalPrice,
        area: Math.round(areaPing * 10) / 10,
        unit_price: unitPrice,
        transaction_date: date,
        date,
        type: type || "未分類",
      } satisfies RealPriceRecord;
    },
  };
}

function buildNewTaipeiConfig(): DatasetConfig {
  return {
    cityName: "新北市",
    datasetId: "139700",
    orderBy: "rps07_yyymmddroc DESC",
    sourceLabel: "city-specific",
    buildWhereClause: (district, keyword) =>
      `"district" LIKE '%${escapeSqlLike(district)}%' AND "rps02" LIKE '%${escapeSqlLike(keyword)}%'`,
    mapRow: (row, indexMap) => {
      const district = String(pickRowValue(row, indexMap, "district") ?? "").trim();
      const location = String(pickRowValue(row, indexMap, "rps02") ?? "").trim();
      const address = location || (district ? `新北市${district}` : "");
      const areaSqm = toNumber(pickRowValue(row, indexMap, "rps15_area"));
      const unitPricePerSqm = toNumber(pickRowValue(row, indexMap, "rps22_amountsunitdollars"));
      const totalPrice = toNumber(pickRowValue(row, indexMap, "rps21_amountsunitdollars"));
      const date = rocToIsoDate(String(pickRowValue(row, indexMap, "rps07_yyymmddroc") ?? "").trim());
      const type = String(pickRowValue(row, indexMap, "rps11") ?? "").trim();

      if (!address || !areaSqm || areaSqm <= 0 || !totalPrice) return null;

      return {
        address,
        total_price: totalPrice,
        area: Math.round(areaSqm * SQM_TO_PING * 10) / 10,
        unit_price: unitPricePerSqm ? Math.round(unitPricePerSqm * (1 / SQM_TO_PING)) : undefined,
        transaction_date: date,
        date,
        type: type || "未分類",
      } satisfies RealPriceRecord;
    },
  };
}

const NATIONAL_DATASET_CONFIG = buildNationalConfig();

const CITY_DATASET_CONFIGS: Record<string, DatasetConfig> = {
  "台中市": buildTaichungConfig(),
  "台北市": buildTaipeiConfig(),
  "台南市": buildTainanConfig(),
  "新北市": buildNewTaipeiConfig(),
};

const CITY_ALIASES: Record<string, string> = {
  "臺北市": "台北市",
  "臺南市": "台南市",
  "臺中市": "台中市",
  "臺東縣": "台東縣",
};

export function resolveRealPriceDatasetPlan(address?: string): RealPriceDatasetPlan {
  const city = extractCity(address);
  const normalizedCity = CITY_ALIASES[city] ?? city;
  const config = CITY_DATASET_CONFIGS[normalizedCity] ?? NATIONAL_DATASET_CONFIG;
  return {
    cityName: normalizedCity || config.cityName,
    datasetId: config.datasetId,
    orderBy: config.orderBy,
    sourceLabel: config.sourceLabel,
  };
}

function resolveDatasetConfig(address?: string): DatasetConfig {
  const plan = resolveRealPriceDatasetPlan(address);
  return CITY_DATASET_CONFIGS[plan.cityName] ?? NATIONAL_DATASET_CONFIG;
}

function mapTwinkleRows(payload: TwinkleResponsePayload, config: DatasetConfig): RealPriceRecord[] {
  const columns = Array.isArray(payload.columns) ? payload.columns : [];
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const indexMap = new Map(columns.map((column, index) => [column, index]));

  return rows
    .map((row) => config.mapRow(row, indexMap))
    .filter((record): record is RealPriceRecord => Boolean(record))
    .sort((left, right) => String(right.transaction_date ?? right.date ?? "").localeCompare(String(left.transaction_date ?? left.date ?? "")));
}

export async function queryTwinkleRealPrice(
  district: string,
  keyword: string,
  limit: number,
  address?: string,
): Promise<RealPriceRecord[]> {
  const apiKey = process.env.TWINKLE_AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("TWINKLE_AI_API_KEY 未設定");
  }
  const config = resolveDatasetConfig(address);

  const response = await fetch(TWINKLE_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "opendata-query_rows",
        arguments: {
          dataset_id: config.datasetId,
          where: config.buildWhereClause(district, keyword),
          order_by: config.orderBy,
          limit,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Twinkle MCP HTTP ${response.status}`);
  }

  const parsed = parseSseDataLine(await response.text());
  if (parsed.error?.message) {
    throw new Error(parsed.error.message);
  }

  return mapTwinkleRows(parsed, config);
}
