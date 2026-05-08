'use client';

import { COLOR_SCHEMES } from '@/lib/branding/color-schemes';

interface ColorSchemeSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export default function ColorSchemeSelector({ value, onChange }: ColorSchemeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {COLOR_SCHEMES.map((scheme) => {
        const isSelected = scheme.id === value;
        return (
          <button
            key={scheme.id}
            type="button"
            onClick={() => onChange(scheme.id)}
            className={`h-20 overflow-hidden rounded-lg border border-slate-200 text-left transition hover:border-slate-400 ${isSelected ? 'ring-2 ring-[#1B3A6B]' : ''}`}
          >
            <div className="h-10 w-full border-b border-slate-200" style={{ backgroundColor: scheme.headerBg }} />
            <p className="px-2 py-1 text-xs text-slate-700">{scheme.name}</p>
          </button>
        );
      })}
    </div>
  );
}
