"use client";

import * as React from "react";
import { mockInvoke } from "@/lib/mock-backend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type PremiumStatusResponse = {
  subscribed: boolean;
  plan: string | null;
  expires_at: string | null;
};

type SubscribePremiumResponse = {
  redirect_url: string;
};

export function PremiumUnlockSection() {
  const [loading, setLoading] = React.useState(true);
  const [subscribed, setSubscribed] = React.useState<boolean>(false);
  const [plan, setPlan] = React.useState<string | null>(null);
  const [expiresAt, setExpiresAt] = React.useState<string | null>(null);
  const [subscribing, setSubscribing] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await mockInvoke<PremiumStatusResponse>("get_premium_status");
        if (cancelled) return;
        setSubscribed(res.subscribed);
        setPlan(res.plan);
        setExpiresAt(res.expires_at);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const res = await mockInvoke<SubscribePremiumResponse>("subscribe_premium");
      window.open(res.redirect_url, "_blank", "noopener,noreferrer");
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>實價登錄 MCP Hub</CardTitle>
          {loading ? null : subscribed ? (
            <Badge className="border-transparent bg-green-100 text-green-700">訂閱中</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-28" />
          </div>
        ) : subscribed ? (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">方案</div>
            <div className="text-sm">{plan ?? "—"}</div>
            <div className="text-sm text-muted-foreground">到期日</div>
            <div className="text-sm">{expiresAt ?? "—"}</div>
            <a
              href="#"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              管理訂閱
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              實價登錄 MCP 整合，提供地政資料一鍵查詢
            </div>
            <Button onClick={handleSubscribe} disabled={subscribing}>
              前往訂閱
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
