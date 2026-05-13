"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * Toaster — 全域 toast 容器
 * 規格對齊 docs/ux-patterns.md：
 * - 成功（綠）：3 秒自動消失
 * - 警告（黃）：5 秒自動消失
 * - 禁用於嚴重錯誤（會錯過）
 */
export function Toaster() {
  return (
    <SonnerToaster
      richColors
      position="bottom-right"
      closeButton
      expand
    />
  );
}

export { toast };
