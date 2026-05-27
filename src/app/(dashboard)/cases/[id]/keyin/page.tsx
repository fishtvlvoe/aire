"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { KeyinSplitPage } from "@/components/KeyinSplitPage";
import { casesApi, coarseCasePropertyType } from "@/lib/cases-api";
import { resolveRuntimeCaseId } from "@/lib/case-routes";

export default function KeyinPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = resolveRuntimeCaseId(String(params.id), searchParams);
  const [propertyType, setPropertyType] = useState<"residential" | "land" | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      const currentCase = await casesApi.get(id);
      if (!cancelled) {
        setPropertyType(coarseCasePropertyType(currentCase.property_type));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id || !propertyType) {
    return <p className="text-sm text-muted-foreground">載入中…</p>;
  }

  return <KeyinSplitPage caseId={id} propertyType={propertyType} />;
}
