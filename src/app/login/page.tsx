"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const FORGOT_PASSWORD_URL = "https://opcos.me/forgot-password";
const DESKTOP_PASSWORD_HELP_URL = "https://opcos.me/login?redirect=/products/aire";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "帳號或密碼錯誤",
  ACCOUNT_EXPIRED: "帳號已過期",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("請輸入 AIRE 桌面版帳號與密碼");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      router.push("/cases/new");
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
            <p className="mt-2 text-xs text-muted-foreground">使用 AIRE 桌面版帳號登入</p>
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
            />
            <div className="relative">
              <Input
                className="pr-11"
                type={showPassword ? "text" : "password"}
                placeholder="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => setShowPassword((current) => !current)}
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

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
            <span className="mx-2 text-slate-300">|</span>
            <a
              href={DESKTOP_PASSWORD_HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              用 Google 或 LINE 購買？
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
