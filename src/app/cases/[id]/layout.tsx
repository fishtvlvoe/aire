// Static export 需要 generateStaticParams 才能讓 [id] 動態段過 build。
// 因為案件 ID 是 runtime 才知，這裡回傳一個 placeholder（'_'），
// 實際路徑由 client-side router 動態解析，placeholder route 不會被使用。

import type { ReactNode } from "react";

export function generateStaticParams() {
  return [{ id: "_" }];
}


export default function CaseIdLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
