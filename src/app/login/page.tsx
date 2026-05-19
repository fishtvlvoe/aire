"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockInvoke } from "@/lib/mock-backend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const FORGOT_PASSWORD_URL = "https://opcos.com.tw";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "帳號或密碼錯誤",
  ACCOUNT_EXPIRED: "帳號已過期",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await mockInvoke("login", { email, password });
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("INVALID_CREDENTIALS")) {
        setError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
      } else if (msg.includes("ACCOUNT_EXPIRED")) {
        setError(AUTH_ERROR_MESSAGES.ACCOUNT_EXPIRED);
      } else {
        setError("登入失敗，請稍後再試");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="items-center space-y-3 pb-4 text-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AIRE</h1>
            <p className="text-sm text-muted-foreground">不動產說明書智能助手</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              required
            />
            <Input
              type="password"
              placeholder="密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              required
            />

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登入中..." : "登入"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <a
              href={FORGOT_PASSWORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              忘記密碼
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
