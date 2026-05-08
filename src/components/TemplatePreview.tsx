'use client';

import { useState } from 'react';

interface TemplatePreviewProps {
  html: string;
  loading?: boolean;
}

export default function TemplatePreview({ html, loading }: TemplatePreviewProps) {
  // 預留 useState，方便未來加互動功能（例如縮放、列印）
  const [_ready, setReady] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border">
        <p className="text-gray-400">載入預覽中...</p>
      </div>
    );
  }

  return (
    <iframe
      srcDoc={html}
      sandbox="allow-same-origin"
      className="w-full h-[800px] border rounded-lg bg-white"
      title="模板預覽"
      onLoad={() => setReady(true)}
    />
  );
}
