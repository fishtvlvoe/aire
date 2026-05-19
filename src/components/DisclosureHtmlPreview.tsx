"use client";

type PropertyType = "residential" | "land";

interface DisclosureHtmlPreviewProps {
  formState: Record<string, unknown>;
  propertyType: PropertyType;
}

export function DisclosureHtmlPreview({ formState, propertyType }: DisclosureHtmlPreviewProps) {
  const agentName = typeof formState.agent_name === "string" ? formState.agent_name : "";

  return (
    <article className="space-y-2 text-sm">
      <p className="text-muted-foreground">物件類型：{propertyType === "residential" ? "成屋" : "土地"}</p>
      <p>承辦人：{agentName}</p>
    </article>
  );
}

export default DisclosureHtmlPreview;
