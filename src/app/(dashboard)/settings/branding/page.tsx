"use client";

import dynamic from "next/dynamic";
import { SettingsTabs } from "@/components/SettingsTabs";

const BrandingContent = dynamic(() => import("./branding-content"), {
  ssr: false,
});

export default function BrandingSettingsPage() {
  return (
    <div className="space-y-6">
      <SettingsTabs />
      <BrandingContent />
    </div>
  );
}
