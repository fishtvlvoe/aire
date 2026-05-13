import React, { useState } from "react";

interface Listing591OutputProps {
  value: string;
}

const hasMarkdown = (text: string) => /\*\*|##|__|\[.*?\]\(.*?\)/.test(text);

export const Listing591Output: React.FC<Listing591OutputProps> = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="relative w-full">
      <label className="block mb-2 font-semibold">591 刊登文</label>
      <button
        className="absolute top-0 right-0 mt-2 mr-2 px-3 py-1 text-xs bg-zinc-200 hover:bg-zinc-300 rounded"
        onClick={handleCopy}
        type="button"
      >
        {copied ? "已複製！" : "複製"}
      </button>
      <textarea
        className="w-full h-40 p-2 border rounded bg-zinc-100 text-zinc-800 resize-none font-mono"
        value={value}
        readOnly
        spellCheck={false}
      />
      {hasMarkdown(value) && (
        <div className="mt-2 text-sm text-red-500">⚠️ 內容含格式符號，建議重新產出</div>
      )}
    </div>
  );
};

export default Listing591Output;
