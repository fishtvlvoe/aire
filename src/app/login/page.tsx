"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import iconDark from "@/assets/icon-dark.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const FORGOT_PASSWORD_URL = "https://opcos.com.tw";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "帳號或密碼錯誤，請重新輸入",
  ACCOUNT_EXPIRED: "此帳號已過期，請聯繫客服",
};

export default function LoginPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/cases");
    }
  }, [isLoading, isAuthenticated, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setSubmitError(null);

    if (!email.trim()) {
      setFieldError("請輸入 Email");
      return;
    }

    if (!password.trim()) {
      setFieldError("請輸入密碼");
      return;
    }

    try {
      await login(email.trim(), password);
      router.replace("/cases");
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      setSubmitError(AUTH_ERROR_MESSAGES[code] ?? "登入失敗，請稍後再試");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="items-center space-y-3 pb-4 text-center">
          <img src={iconDark.src} alt="AIRE Logo" className="h-14 w-14" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AIRE</h1>
            <p className="text-sm text-muted-foreground">不動產說明書自動化系統</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={isLoading}
            />
            <Input
              type="password"
              placeholder="密碼"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
            />

            {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

            <Button type="submit" className="w-full" disabled={isLoading}>
              登入
            </Button>
          </form>

          <div className="mt-4 text-center">
            <a
              href={FORGOT_PASSWORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              忘記密碼？
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
