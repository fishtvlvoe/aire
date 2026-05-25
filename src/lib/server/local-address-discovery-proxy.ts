import type { ParcelInfo } from "@/lib/land-registry-api";
import { mockInvoke } from "@/lib/mock-backend";

export type AddressDiscoveryStatus = "candidate_found" | "manual_required";

export interface DiscoveryError {
  source: string;
  code: string;
  message: string;
}

export interface AddressDiscoveryResult {
  status: AddressDiscoveryStatus;
  source: "local_discovery";
  candidates: ParcelInfo[];
  errors: DiscoveryError[];
  total_cost_cents: number;
}

interface RegistryQueryRun {
  source_input?: string;
  candidate_json?: {
    errors?: DiscoveryError[] | null;
  };
  total_cost_cents?: number;
}

function normalizeAddress(value: string): string {
  return (value ?? "").trim();
}

function hasTrustedCandidates(candidates: ParcelInfo[]): ParcelInfo[] {
  return candidates.filter((candidate) => candidate.trusted_for_pdf === true);
}

function fallbackManualResult(address: string): AddressDiscoveryResult {
  const normalized = normalizeAddress(address);
  const message = normalized
    ? "本機環境無法取得可直接補齊的地址候選，請先人工確認地段、地號、建號"
    : "請先輸入完整地址";
  return {
    status: "manual_required",
    source: "local_discovery",
    candidates: [],
    errors: [
      {
        source: "local_discovery",
        code: "local_proxy_manual_required",
        message,
      },
    ],
    total_cost_cents: 0,
  };
}

async function getLatestDiscoveryRun(address: string): Promise<RegistryQueryRun | null> {
  const normalized = normalizeAddress(address);
  const runs = await mockInvoke<RegistryQueryRun[]>("list_registry_query_runs", {});
  return runs.find((run) => normalizeAddress(String(run.source_input ?? "")) === normalized) ?? runs[0] ?? null;
}

export async function discoverAddressLocally(address: string): Promise<AddressDiscoveryResult> {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return fallbackManualResult(normalized);
  }

  const candidates = await mockInvoke<ParcelInfo[]>("land_registry_address_lookup", { address: normalized });
  const trustedCandidates = hasTrustedCandidates(candidates ?? []);
  if (trustedCandidates.length > 0) {
    return {
      status: "candidate_found",
      source: "local_discovery",
      candidates: trustedCandidates,
      errors: [],
      total_cost_cents: 0,
    };
  }

  const run = await getLatestDiscoveryRun(normalized);
  const runErrors = run?.candidate_json?.errors ?? [];
  const statusError =
    runErrors[0] ??
    {
      source: "local_discovery",
      code: "local_proxy_manual_required",
      message: "本機環境無法取得可直接補齊的地址候選，請先人工確認地段、地號、建號",
    };

  return {
    status: "manual_required",
    source: "local_discovery",
    candidates: [],
    errors: [statusError],
    total_cost_cents: run?.total_cost_cents ?? 0,
  };
}
