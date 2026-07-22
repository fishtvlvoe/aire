"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { exchangeDesktopBootstrapCode } from "@/lib/auth";
import { signInWithEmail, signInWithProvider } from "@/lib/auth/auth-client";
import { AIRE_OAUTH_PROVIDERS, type AireOAuthProviderId } from "@/lib/aire-oauth-providers";
import {
  readAireBrowserSession,
  getAireEntryLoginRedirectUrl,
  getAireBrowserToolBaseUrl,
  AIRE_BROWSER_TOOL_BASE_URL,
} from "@/lib/aire-saas-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const FORGOT_PASSWORD_URL = "/forgot-password";
const AIRE_LICENSE_HELP_URL = "https://aire.opcos.me/license";
const AIRE_SIGNUP_URL = "https://aire.opcos.me/signup";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "帳號或密碼錯誤",
  ACCOUNT_EXPIRED: "帳號已過期",
  ENTITLEMENT_REQUIRED: "此帳號尚未啟用 AIRE 授權，請先啟用或購買序號",
  DEVICE_LIMIT_EXCEEDED: "可用設備席次不足，請解除舊設備或新增序號",
};

export type LoginMode = "password" | "bootstrap";

export function LoginPageClient({ initialMode }: { initialMode?: LoginMode }) {
  return (
    <Suspense fallback={null}>
      <LoginPageClientContent initialMode={initialMode} />
    </Suspense>
  );
}

function LoginPageClientContent({ initialMode }: { initialMode?: LoginMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedMode = searchParams.get("mode") === "bootstrap" ? "bootstrap" : "password";
  const resolvedInitialMode = initialMode ?? requestedMode;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [bootstrapCode, setBootstrapCode] = useState("");
  const [mode, setMode] = useState<LoginMode>(resolvedInitialMode);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const bootstrapInputRef = useRef<HTMLInputElement | null>(null);

  const safeReturnTo = validateReturnTo(searchParams.get("returnTo"));

  const isRedirecting =
    shouldUseAireEntryAuth() &&
    (!readAireBrowserSession() || readAireBrowserSession()?.licenseStatus !== "active");

  useEffect(() => {
    if (isRedirecting) {
      window.location.assign(
        getAireEntryLoginRedirectUrl(toAbsoluteBrowserReturnTo(safeReturnTo))
      );
    }
  }, [isRedirecting, safeReturnTo]);

  useEffect(() => {
    if (isRedirecting) return;
    setMode(resolvedInitialMode);
    setError("");
  }, [resolvedInitialMode, isRedirecting]);

  useEffect(() => {
    if (isRedirecting) return;
    const session = readAireBrowserSession();
    if (session?.licenseStatus === "active") {
      router.replace(safeReturnTo);
      return;
    }
    if (loading) return;
    if (mode === "bootstrap") {
      bootstrapInputRef.current?.focus();
      return;
    }
    if (!document.activeElement || document.activeElement === document.body) {
      emailInputRef.current?.focus();
    }
  }, [loading, mode, router, safeReturnTo, isRedirecting]);

  function switchMode(nextMode: LoginMode) {
    setMode(nextMode);
    setError("");
    if (nextMode === "password") {
      setBootstrapCode("");
    } else {
      setShowPassword(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("請輸入 AIRE Email 與密碼");
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithEmail(email, password, safeReturnTo);
      if (result?.redirectingToEntry) return;
      router.push(safeReturnTo);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("INVALID_CREDENTIALS")) {
        setError(AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS);
      } else if (msg.includes("ACCOUNT_EXPIRED")) {
        setError(AUTH_ERROR_MESSAGES.ACCOUNT_EXPIRED);
      } else if (msg.includes("ENTITLEMENT_REQUIRED")) {
        setError(AUTH_ERROR_MESSAGES.ENTITLEMENT_REQUIRED);
      } else if (msg.includes("DEVICE_LIMIT_EXCEEDED")) {
        setError(AUTH_ERROR_MESSAGES.DEVICE_LIMIT_EXCEEDED);
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
      router.push(safeReturnTo);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("BOOTSTRAP_CODE_EXPIRED")) {
        setError("一次性登入碼已失效，請回 AIRE SaaS 入口重新產生");
      } else if (msg.includes("ENTITLEMENT_REQUIRED")) {
        setError(AUTH_ERROR_MESSAGES.ENTITLEMENT_REQUIRED);
      } else {
        setError("一次性登入失敗，請稍後再試");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: AireOAuthProviderId) {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithProvider(provider, safeReturnTo);
      if (result?.redirectingToEntry) return;
    } catch {
      setError(`${AIRE_OAUTH_PROVIDERS[provider].name} 登入失敗，請稍後再試`);
    } finally {
      setLoading(false);
    }
  }

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center space-y-3">
          <p className="text-sm font-medium text-slate-700">正在導向 AIRE 帳號入口...</p>
          <p className="text-xs text-slate-400">請稍候，我們將帶您進行安全登入</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_42%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-slate-200/80 bg-white/80 p-7 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="max-w-lg">
            <p className="text-sm font-medium tracking-normal text-slate-500">AIRE SaaS Access</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-slate-950">登入 AIRE SaaS</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              入口只負責帳號、授權、序號與設備綁定；通過後進入 Browser 工具版處理案件與補件。
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Mail className="h-5 w-5 text-slate-700" />
              <p className="mt-3 text-sm font-medium text-slate-900">AIRE 帳號登入</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Email 與密碼只屬於 AIRE SaaS。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <KeyRound className="h-5 w-5 text-slate-700" />
              <p className="mt-3 text-sm font-medium text-slate-900">序號授權</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">檢查工作區可用序號數與服務開通狀態。</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <ShieldCheck className="h-5 w-5 text-slate-700" />
              <p className="mt-3 text-sm font-medium text-slate-900">設備綁定</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">超過可用設備數時先解除舊設備或新增序號。</p>
            </div>
          </div>
        </section>

        <Card className="border-slate-200/90 bg-white shadow-[0_18px_50px_-36px_rgba(15,23,42,0.45)]">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-2xl text-slate-950">帳號驗證</CardTitle>
            <CardDescription>
              使用 AIRE Email 與密碼登入，通過授權後進入 Browser 工具版。
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
                onClick={() => switchMode("password")}
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
                onClick={() => switchMode("bootstrap")}
              >
                一次性登入碼
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <Input
                ref={emailInputRef}
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
                      ref={passwordInputRef}
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

                  <div className="grid grid-cols-2 gap-3">
                    {Object.values(AIRE_OAUTH_PROVIDERS).map((provider) => (
                      <Button
                        key={provider.id}
                        type="button"
                        variant="outline"
                        className="border-slate-300 bg-white"
                        disabled={loading}
                        onClick={() => void handleSocialLogin(provider.id)}
                      >
                        使用 {provider.name} 登入
                      </Button>
                    ))}
                  </div>
                </form>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleBootstrapLogin();
                  }}
                >
                  <Input
                    ref={bootstrapInputRef}
                    type="text"
                    placeholder="一次性 AIRE 登入碼"
                    value={bootstrapCode}
                    onChange={(e) => setBootstrapCode(e.target.value)}
                    autoComplete="one-time-code"
                    disabled={loading}
                  />

                  {error ? <p className="text-sm text-destructive">{error}</p> : null}

                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full border-slate-300 bg-slate-50"
                    disabled={loading}
                  >
                    {loading ? "驗證中..." : "使用 AIRE 碼"}
                  </Button>
                </form>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">還沒有 AIRE SaaS 帳號？</p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href={AIRE_SIGNUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-slate-700"
                >
                  建立 AIRE 帳號
                  <ArrowUpRight className="h-4 w-4" />
                </a>
                <a
                  href={AIRE_LICENSE_HELP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-slate-700"
                >
                  授權與設備說明
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

function validateReturnTo(raw: string | null): string {
  if (!raw) return "/cases";
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (host === "aire-browser.opcos.me" || host.endsWith(".aire-browser.pages.dev") || host === "localhost" || host === "127.0.0.1") {
      return url.pathname + url.search;
    }
  } catch {
  }
  return "/cases";
}

function shouldUseAireEntryAuth(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "aire-browser.opcos.me" || host.endsWith(".aire-browser.pages.dev");
}

function toAbsoluteBrowserReturnTo(returnTo: string): string {
  if (returnTo.startsWith("https://aire-browser.opcos.me") || returnTo.includes(".aire-browser.pages.dev")) {
    return returnTo;
  }
  if (returnTo.startsWith("/")) {
    return `${getAireBrowserToolBaseUrl()}${returnTo}`;
  }
  return AIRE_BROWSER_TOOL_BASE_URL;
}

