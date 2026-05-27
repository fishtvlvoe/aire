export function caseDetailHref(caseId: string, tab?: string | null): string {
  const query = new URLSearchParams({ caseId });
  if (tab) query.set("tab", tab);
  return `/cases/_?${query.toString()}`;
}

export function casePreviewHref(caseId: string): string {
  return `/cases/_/preview?caseId=${encodeURIComponent(caseId)}`;
}

export function caseLegacyHref(caseId: string): string {
  return `/cases/_/legacy?caseId=${encodeURIComponent(caseId)}`;
}

export function caseKeyinHref(caseId: string): string {
  return `/cases/_/keyin?caseId=${encodeURIComponent(caseId)}`;
}

export function resolveRuntimeCaseId(
  routeId: string | undefined,
  searchParams: URLSearchParams,
): string | undefined {
  const queryId = searchParams.get("caseId") ?? undefined;
  return routeId === "_" ? queryId : routeId;
}
