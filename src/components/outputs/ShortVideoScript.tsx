import React, { useState } from 'react';

interface ShortVideoScriptProps {
  short_video_script: string;
}

const ShortVideoScript: React.FC<ShortVideoScriptProps> = ({ short_video_script }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(short_video_script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="space-y-2">
      <textarea
        className="w-full p-2 border rounded bg-gray-50 resize-none text-sm"
        value={short_video_script}
        readOnly
        rows={6}
      />
      <button
        className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        onClick={handleCopy}
        type="button"
      >
        {copied ? '已複製！' : '複製'}
      </button>
      <div className="text-xs text-gray-500 mt-2">
        複製劇本後，請貼入 FlowGo 的文字節點，執行流程產出短影片。
      </div>
    </div>
  );
};

export default ShortVideoScript;
