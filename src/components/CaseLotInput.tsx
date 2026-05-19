"use client";

interface CaseLotInputProps {
  value: string[];
  onChange: (lots: string[]) => void;
}

export function CaseLotInput({ value, onChange }: CaseLotInputProps) {
  const lots = value.length > 0 ? value : [""];

  const handleChange = (index: number, newVal: string) => {
    const next = [...lots];
    next[index] = newVal;
    onChange(next);
  };

  const handleAdd = () => {
    onChange([...lots, ""]);
  };

  const handleRemove = (index: number) => {
    if (lots.length <= 1) return;
    const next = lots.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div data-testid="case-lot-inputs" className="flex flex-col gap-2">
      {lots.map((lot, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={lot}
            onChange={(e) => handleChange(i, e.target.value)}
            placeholder="地號（如 123-4）"
            className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => handleRemove(i)}
            disabled={lots.length <= 1}
            className="rounded px-2 py-1 text-sm text-muted-foreground hover:text-destructive disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="ㄧ"
          >
            ㄧ
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAdd}
        className="self-start rounded px-2 py-1 text-sm text-muted-foreground hover:text-primary"
        aria-label="＋"
      >
        ＋ 新增地號
      </button>
    </div>
  );
}
