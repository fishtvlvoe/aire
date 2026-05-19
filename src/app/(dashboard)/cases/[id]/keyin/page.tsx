"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { KeyinSplitPage } from "@/components/KeyinSplitPage";
import { casesApi } from "@/lib/cases-api";

export default function KeyinPage() {
  const params = useParams();
  const id = String(params.id);
  const [propertyType, setPropertyType] = useState<"residential" | "land" | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const currentCase = await casesApi.get(id);
      if (!cancelled) {
        setPropertyType(currentCase.property_type);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!propertyType) {
    return <p className="text-sm text-muted-foreground">載入中…</p>;
  }

  return <KeyinSplitPage caseId={id} propertyType={propertyType} />;
}
