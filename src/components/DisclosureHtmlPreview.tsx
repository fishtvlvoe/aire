"use client";

import { DossierPage6Notices } from "./DossierPage6Notices";
import { DossierPage7FeeTable, type TaxInputs } from "./DossierPage7FeeTable";
import { DossierPage8TaxNotes } from "./DossierPage8TaxNotes";
import { DossierSurroundingMap } from "./DossierSurroundingMap";

type PropertyType = "residential" | "land";

interface DisclosureHtmlPreviewProps {
  formState: Record<string, unknown>;
  propertyType: PropertyType;
  taxInputs?: TaxInputs;
}

export function DisclosureHtmlPreview({ formState, propertyType, taxInputs }: DisclosureHtmlPreviewProps) {
  const agentName = typeof formState.agent_name === "string" ? formState.agent_name : "";
  const address = typeof formState.address === "string" ? formState.address : "";

  return (
    <article className="space-y-2 text-sm">
      <p className="text-muted-foreground">物件類型：{propertyType === "residential" ? "成屋" : "土地"}</p>
      <p>承辦人：{agentName}</p>

      <DossierPage6Notices />

      {taxInputs ? (
        <DossierPage7FeeTable {...taxInputs} />
      ) : (
        <section>
          <h2>第七頁：費用一覽表</h2>
          <p>—</p>
        </section>
      )}

      <DossierPage8TaxNotes />

      {address && <DossierSurroundingMap address={address} />}
    </article>
  );
}

export default DisclosureHtmlPreview;
