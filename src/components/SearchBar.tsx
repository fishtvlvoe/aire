'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onSearch: (q: string) => void;
  includeArchived: boolean;
  onToggleArchived: (v: boolean) => void;
  showArchivedToggle: boolean;
}

export default function SearchBar({ onSearch, includeArchived, onToggleArchived, showArchivedToggle }: Props) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onSearch(value), 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [value, onSearch]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-48 max-w-sm">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <input
          type="search"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="搜尋物件地址、類型..."
          className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-[#1B3A6B] focus:outline-none focus:ring-1 focus:ring-[#1B3A6B]"
        />
      </div>

      {showArchivedToggle && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={e => onToggleArchived(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#1B3A6B]"
          />
          包含封存
        </label>
      )}
    </div>
  );
}
