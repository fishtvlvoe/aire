"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { exchangeDesktopBootstrapCode, login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const FORGOT_PASSWORD_URL = "https://opcos.me/forgot-password";
const DESKTOP_PASSWORD_HELP_URL = "https://opcos.me/products/aire?intent=desktop-login";
const DESKTOP_SIGNUP_URL = "https://opcos.me/products/aire";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "帳號或密碼錯誤",
  ACCOUNT_EXPIRED: "帳號已過期",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bootstrapCode, setBootstrapCode] = useState("");
  const [mode, setMode] = useState<"password" | "bootstrap">("password");
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

  async function handleBootstrapLogin() {
    setError("");
    if (!email.trim() || !bootstrapCode.trim()) {
      setError("請輸入 Email 與一次性桌面登入碼");
      return;
    }
    setLoading(true);
    try {
      await exchangeDesktopBootstrapCode(email, bootstrapCode);
      router.push("/cases/new");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("BOOTSTRAP_CODE_EXPIRED")) {
        setError("一次性登入碼已失效，請回 opcos.me 重新產生");
      } else if (msg.includes("ENTITLEMENT_REQUIRED")) {
        setError("此帳號尚未啟用 AIRE 權限，請先在 opcos.me 確認方案");
      } else {
        setError("一次性登入失敗，請稍後再試");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-7 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="max-w-lg">
            <p className="text-sm font-medium tracking-normal text-slate-500">AIRE Desktop Access</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">登入 AIRE 桌面版</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              先完成登入，才能測地址查詢、正式地政資料與 PDF 產出流程。
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Mail className="h-5 w-5 text-slate-700" />
              <p className="mt-3 text-sm font-medium text-slate-900">桌面帳號登入</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">已設定密碼的 AIRE 帳號直接登入。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <KeyRound className="h-5 w-5 text-slate-700" />
              <p className="mt-3 text-sm font-medium text-slate-900">一次性登入碼</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Google 或 LINE 購買用戶先到 opcos.me 產生登入碼。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <ShieldCheck className="h-5 w-5 text-slate-700" />
              <p className="mt-3 text-sm font-medium text-slate-900">正式資料驗證</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">登入後再測 confirmed key、COP 與 PDF 主流程。</p>
            </div>
          </div>
        </section>

        <Card className="border-slate-200/90 bg-white shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-2xl text-slate-950">帳號驗證</CardTitle>
            <CardDescription>
              使用 AIRE 桌面版帳號登入。Google 或 LINE 購買用戶請改用一次性登入碼。
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div
              className="grid w-full grid-cols-2 rounded-lg bg-slate-100 p-1"
              role="tablist"
              aria-label="登入模式"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "password"}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  mode === "password" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                }`}
                onClick={() => {
                  setMode("password");
                  setError("");
                }}
              >
                帳號密碼
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "bootstrap"}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  mode === "bootstrap" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                }`}
                onClick={() => {
                  setMode("bootstrap");
                  setError("");
                }}
              >
                一次性登入碼
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />

              {mode === "password" ? (
                <form onSubmit={handleLogin} className="space-y-4">
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
              ) : (
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="一次性桌面登入碼"
                    value={bootstrapCode}
                    onChange={(e) => setBootstrapCode(e.target.value)}
                    autoComplete="one-time-code"
                    disabled={loading}
                  />

                  {error ? <p className="text-sm text-destructive">{error}</p> : null}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-slate-300 bg-slate-50"
                    disabled={loading}
                    onClick={() => void handleBootstrapLogin()}
                  >
                    {loading ? "驗證中..." : "使用桌面碼"}
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">還沒有桌面登入資料？</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href={DESKTOP_SIGNUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-slate-700"
                >
                  建立帳號或購買
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href={DESKTOP_PASSWORD_HELP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-slate-700"
                >
                  取得桌面登入碼
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href={FORGOT_PASSWORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-slate-700"
                >
                  忘記密碼
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
