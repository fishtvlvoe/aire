import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 房產文件系統",
  description: "三段式 AI 房產文件自動產出系統（委託前 → 現勘 → 補充 → 文件生成）",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
