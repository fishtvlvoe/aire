"use client";

import { LicenseSection } from "@/components/settings/LicenseSection";
import { LandApiSection } from "@/components/settings/LandApiSection";
import { PremiumUnlockSection } from "@/components/settings/PremiumUnlockSection";
import { DevSuperAdmin } from "@/components/settings/DevSuperAdmin";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>
      <LicenseSection />
      <LandApiSection />
      <PremiumUnlockSection />
      <DevSuperAdmin />
    </div>
  );
}
