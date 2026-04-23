"use client";

import React, { useMemo, useState } from "react";

export type LayoutValue = {
  rooms: number;
  halls: number;
  baths: number;
  kitchens: number;
};

export type LayoutSelectorProps = {
  value: LayoutValue;
  onChange: (v: LayoutValue) => void;
};

const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

const toInt = (raw: string): number => {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
};

const formatLayout = (v: LayoutValue): string => {
  const parts: string[] = [];
  if (v.rooms > 0) parts.push(`${v.rooms}房`);
  if (v.halls > 0) parts.push(`${v.halls}廳`);
  if (v.baths > 0) parts.push(`${v.baths}衛`);
  if (v.kitchens > 0) parts.push(`${v.kitchens}廚`);
  return parts.length > 0 ? parts.join("") : "—";
};

type PresetKey = "1-1-1" | "2-1-1" | "3-2-2" | "4-2-2" | "other";

const PRESETS: Array<{ key: PresetKey; label: string; value: LayoutValue | null }> = [
  { key: "1-1-1", label: "1房1廳1衛", value: { rooms: 1, halls: 1, baths: 1, kitchens: 0 } },
  { key: "2-1-1", label: "2房1廳1衛", value: { rooms: 2, halls: 1, baths: 1, kitchens: 0 } },
  { key: "3-2-2", label: "3房2廳2衛", value: { rooms: 3, halls: 2, baths: 2, kitchens: 0 } },
  { key: "4-2-2", label: "4房2廳2衛", value: { rooms: 4, halls: 2, baths: 2, kitchens: 0 } },
  { key: "other", label: "其他", value: null },
];

export default function LayoutSelector({ value, onChange }: LayoutSelectorProps) {
  const [mode, setMode] = useState<"numeric" | "options">("numeric");
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("other");

  const displayText = useMemo(() => formatLayout(value), [value]);

  const update = (patch: Partial<LayoutValue>) => {
    onChange({
      rooms: clamp(patch.rooms ?? value.rooms, 0, 10),
      halls: clamp(patch.halls ?? value.halls, 0, 10),
      baths: clamp(patch.baths ?? value.baths, 0, 10),
      kitchens: clamp(patch.kitchens ?? value.kitchens, 0, 10),
    });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">格局</p>
        <button
          type="button"
          className="text-xs text-blue-600 hover:text-blue-800"
          onClick={() => setMode((m) => (m === "numeric" ? "options" : "numeric"))}
        >
          切換選項模式
        </button>
      </div>

      {mode === "options" ? (
        <div className="mt-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRESETS.map((p) => {
              const isActive = selectedPreset === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setSelectedPreset(p.key);
                    if (p.value) onChange(p.value);
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {selectedPreset === "other" && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <label className="text-sm text-slate-700">
                房
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={value.rooms}
                  onChange={(e) => update({ rooms: toInt(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="text-sm text-slate-700">
                廳
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={value.halls}
                  onChange={(e) => update({ halls: toInt(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="text-sm text-slate-700">
                衛
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={value.baths}
                  onChange={(e) => update({ baths: toInt(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="text-sm text-slate-700">
                廚
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={value.kitchens}
                  onChange={(e) => update({ kitchens: toInt(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="text-sm text-slate-700">
            房
            <input
              type="number"
              min={0}
              max={10}
              value={value.rooms}
              onChange={(e) => update({ rooms: toInt(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-700">
            廳
            <input
              type="number"
              min={0}
              max={10}
              value={value.halls}
              onChange={(e) => update({ halls: toInt(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-700">
            衛
            <input
              type="number"
              min={0}
              max={10}
              value={value.baths}
              onChange={(e) => update({ baths: toInt(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-700">
            廚
            <input
              type="number"
              min={0}
              max={10}
              value={value.kitchens}
              onChange={(e) => update({ kitchens: toInt(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>
      )}

      <p className="mt-3 text-sm text-slate-600">組合：{displayText}</p>
    </div>
  );
}
