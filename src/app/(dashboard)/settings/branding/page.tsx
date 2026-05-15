"use client";

import dynamic from "next/dynamic";

const BrandingContent = dynamic(() => import("./branding-content"), {
  ssr: false,
});

export default function BrandingSettingsPage() {
  return <BrandingContent />;
}
