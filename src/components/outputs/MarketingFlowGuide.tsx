import React from 'react';

const platforms = [
  {
    name: 'YouTube Shorts',
    action: '上傳短影片至 Shorts',
  },
  {
    name: 'YouTube',
    action: '分享至 YouTube 頻道',
  },
  {
    name: 'Facebook',
    action: '發佈至 Facebook 粉專',
  },
];

const Arrow = () => (
  <div className="flex items-center mx-2">
    <span className="text-2xl text-gray-400">→</span>
  </div>
);

const MarketingFlowGuide: React.FC = () => (
  <div className="bg-white p-4 rounded shadow space-y-4">
    <div className="font-bold text-lg mb-2">三平台導流順序</div>
    <div className="flex items-center justify-center mb-4">
      {platforms.map((platform, idx) => (
        <React.Fragment key={platform.name}>
          <div className="bg-blue-50 border border-blue-200 rounded p-4 min-w-[140px] text-center">
            <div className="font-semibold text-blue-700">{platform.name}</div>
            <div className="text-sm text-blue-500 mt-1">{platform.action}</div>
          </div>
          {idx < platforms.length - 1 && <Arrow />}
        </React.Fragment>
      ))}
    </div>
    <div className="text-xs text-gray-500 text-center">
      請依照順序操作，提升導流效果。
    </div>
  </div>
);

export default MarketingFlowGuide;
