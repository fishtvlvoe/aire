"use client";

import React, { useEffect, useId, useState } from "react";

export interface Props {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const CONSENT_KEY = "llm_vision_consent";

function getStoredConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "true";
  } catch {
    return false;
  }
}

function ShieldIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path
        d="M12 2.25c2.3 1.9 5.2 2.9 8.25 3.25v7.2c0 5.3-3.6 9.9-8.25 11.05C7.35 22.6 3.75 18 3.75 12.7V5.5C6.8 5.15 9.7 4.15 12 2.25Z"
        className="fill-slate-200"
      />
      <path
        d="M12 2.25c2.3 1.9 5.2 2.9 8.25 3.25v7.2c0 5.3-3.6 9.9-8.25 11.05C7.35 22.6 3.75 18 3.75 12.7V5.5C6.8 5.15 9.7 4.15 12 2.25Z"
        className="stroke-slate-600"
        strokeWidth="1.5"
      />
      <path
        d="M8.5 12.2l2.2 2.2 4.8-5"
        className="stroke-slate-700"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon(props: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={props.className}>
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        className="stroke-slate-500"
        strokeWidth="1.5"
      />
      <path
        d="M12 10.5v6"
        className="stroke-slate-600"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 7.5h.01"
        className="stroke-slate-600"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

type DialogContentsProps = {
  titleId: string;
  descriptionId: string;
  onAccept: () => void;
  onDecline: () => void;
};

function DialogContents({ titleId, descriptionId, onAccept, onDecline }: DialogContentsProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onDecline();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/10">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 ring-1 ring-slate-200">
            <ShieldIcon className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              啟用 AI 影像辨識
            </h2>
            <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-700">
              您的文件影像將傳送至 AI 服務（Claude/Gemini）進行辨識，協助自動填入欄位。影像不會被儲存或用於訓練。
            </p>

            <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <InfoIcon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="text-xs leading-5 text-slate-700">
                請確認您理解並同意上述資料傳輸與隱私影響後再啟用。
              </p>
            </div>

            <label className="mt-4 flex items-start gap-2 text-sm text-slate-800">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <span>我了解並同意傳送文件影像進行辨識</span>
            </label>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                onClick={onDecline}
              >
                取消
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                  checked ? "bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-blue-300"
                }`}
                disabled={!checked}
                onClick={onAccept}
              >
                確認啟用
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LLMVisionConsentDialog({ open, onAccept, onDecline }: Props) {
  const titleId = useId();
  const descriptionId = useId();

  const storedConsent = open ? getStoredConsent() : false;

  useEffect(() => {
    if (!open) return;
    if (!storedConsent) return;
    onAccept();
  }, [open, storedConsent, onAccept]);

  useEffect(() => {
    if (!open || storedConsent) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDecline();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, storedConsent, onDecline]);

  useEffect(() => {
    if (!open || storedConsent) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, storedConsent]);

  if (!open) return null;
  if (storedConsent) return null;

  const handleAccept = () => {
    try {
      window.localStorage.setItem(CONSENT_KEY, "true");
    } catch {
      // localStorage may be unavailable (private mode / blocked) — still allow user to proceed.
    }
    onAccept();
  };

  return (
    <DialogContents
      titleId={titleId}
      descriptionId={descriptionId}
      onAccept={handleAccept}
      onDecline={onDecline}
    />
  );
}
