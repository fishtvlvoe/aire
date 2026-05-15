"use client";

/**
 * 地政 API 設定頁
 *
 * 包含 ApiKeySettings（金鑰設定）+ BalanceMonitor（餘額監控）。
 * 路由：/settings/api-key
 */

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiKeySettings } from "@/components/ApiKeySettings";
import { BalanceMonitor } from "@/components/BalanceMonitor";

export default function ApiKeySettingsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-6 space-y-6">
      {/* 返回設定頁連結 */}
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/settings">
            <ArrowLeft className="h-4 w-4" />
            返回設定
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>地政 API 設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ApiKeySettings />
          <BalanceMonitor />
        </CardContent>
      </Card>
    </div>
  );
}
