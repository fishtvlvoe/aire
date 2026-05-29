export function caseDetailHref(caseId: string, tab?: string | null): string {
  const query = new URLSearchParams();
  if (tab) query.set("tab", tab);
  const suffix = query.toString();
  return suffix ? `/cases/${encodeURIComponent(caseId)}?${suffix}` : `/cases/${encodeURIComponent(caseId)}`;
}

export function casePreviewHref(caseId: string): string {
  return `/cases/${encodeURIComponent(caseId)}/preview`;
}

export function caseLegacyHref(caseId: string): string {
  return `/cases/${encodeURIComponent(caseId)}/legacy`;
}

export function caseKeyinHref(caseId: string): string {
  return `/cases/${encodeURIComponent(caseId)}/keyin`;
}

export function resolveRuntimeCaseId(
  routeId: string | undefined,
  searchParams: URLSearchParams,
): string | undefined {
  const queryId = searchParams.get("caseId") ?? undefined;
  return routeId === "_" ? queryId : routeId;
}
