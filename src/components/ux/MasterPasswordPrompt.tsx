"use client";

import * as React from "react";
import "@testing-library/jest-dom/vitest";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MasterPasswordPromptProps {
  onUnlock: (password: string) => Promise<void>;
}

const WRONG_PASSWORD_MESSAGE = "主密碼錯誤，請再試一次";
const SHORT_PASSWORD_MESSAGE = "主密碼至少 8 個字元";

export default function MasterPasswordPrompt({ onUnlock }: MasterPasswordPromptProps) {
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if ([...password].length < 8) {
      setError(SHORT_PASSWORD_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onUnlock(password);
      setPassword("");
    } catch {
      setPassword("");
      setError(WRONG_PASSWORD_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-sm">
      <header className="mb-4 flex items-start gap-3">
        <div className="mt-1 rounded-md bg-muted p-2">
          <KeyRound className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">輸入主密碼以解鎖</h2>
          <p className="text-sm text-muted-foreground">請使用您設定的主密碼繼續。</p>
        </div>
      </header>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="master-password-input">
            主密碼
          </label>
          <div className="flex gap-2">
            <Input
              autoComplete="current-password"
              id="master-password-input"
              name="master-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="輸入主密碼"
              role="textbox"
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <Button
              aria-label={showPassword ? "隱藏主密碼" : "顯示主密碼"}
              onClick={() => setShowPassword((prev) => !prev)}
              type="button"
              variant="outline"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <Button disabled={isSubmitting} type="submit">
            解鎖
          </Button>
          <a
            className="text-sm text-primary underline-offset-4 hover:underline"
            href="/recovery"
            role="button"
          >
            忘記主密碼？使用救援碼恢復
          </a>
        </div>
      </form>
    </section>
  );
}
