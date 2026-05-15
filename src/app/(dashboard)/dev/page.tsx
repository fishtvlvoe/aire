"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DevSuperAdmin } from "@/components/settings/DevSuperAdmin";

export default function DevPage() {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      router.replace("/");
    }
  }, [router]);

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <main className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">開發者控制台</h1>
        <p className="text-sm text-muted-foreground">
          開發模式可切換 feature flags，立即驗證 UI/流程差異。
        </p>
      </header>
      <DevSuperAdmin />
    </main>
  );
}
