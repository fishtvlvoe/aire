import React, { useState } from "react";

const PLATFORMS = [
  { name: "Facebook", max: 63206 },
  { name: "Instagram", max: 2200 },
  { name: "Threads", max: 500 },
  { name: "TikTok", max: 2200 },
  { name: "YouTube", max: 5000 },
];

const hasMarkdown = (text: string) => /\*\*|##|__|\[.*?\]\(.*?\)/.test(text);

interface SocialPostTabsProps {
  values: { [platform: string]: string };
}

export const SocialPostTabs: React.FC<SocialPostTabsProps> = ({ values }) => {
  const [tab, setTab] = useState(PLATFORMS[0].name);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, platform: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(null), 1000);
  };

  return (
    <div className="w-full">
      <div className="flex border-b mb-4">
        {PLATFORMS.map((p) => (
          <button
            key={p.name}
            className={`px-4 py-2 -mb-px border-b-2 font-medium transition-colors duration-150 ${tab === p.name ? "border-blue-500 text-blue-600" : "border-transparent text-zinc-500 hover:text-blue-500"}`}
            onClick={() => setTab(p.name)}
            type="button"
          >
            {p.name}
          </button>
        ))}
      </div>
      {PLATFORMS.map((p) => {
        const value = values[p.name] || "";
        const count = value.length;
        const over = count > p.max;
        return tab === p.name ? (
          <div key={p.name} className="relative">
            <button
              className="absolute top-0 right-0 mt-2 mr-2 px-3 py-1 text-xs bg-zinc-200 hover:bg-zinc-300 rounded"
              onClick={() => handleCopy(value, p.name)}
              type="button"
            >
              {copied === p.name ? "已複製！" : "複製"}
            </button>
            <textarea
              className="w-full h-40 p-2 border rounded bg-zinc-100 text-zinc-800 resize-none font-mono"
              value={value}
              readOnly
              spellCheck={false}
            />
            <div className={`mt-2 text-sm ${over ? "text-red-500" : "text-zinc-500"}`}>
              {count} / {p.max}
            </div>
            {hasMarkdown(value) && (
              <div className="mt-2 text-sm text-red-500">⚠️ 內容含格式符號，建議重新產出</div>
            )}
          </div>
        ) : null;
      })}
    </div>
  );
};

export default SocialPostTabs;
