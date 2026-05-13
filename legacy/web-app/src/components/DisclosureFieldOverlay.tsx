'use client';

import { useEffect, useRef, useState } from 'react';

type FieldPositionView = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
};

type SaveState = 'idle' | 'saving' | 'success' | 'error';

interface DisclosureFieldOverlayProps {
  fieldKey: string;
  label: string;
  value: string;
  position: FieldPositionView;
  onSave: (fieldKey: string, value: string) => Promise<void>;
}

export default function DisclosureFieldOverlay({
  fieldKey,
  label,
  value,
  position,
  onSave,
}: DisclosureFieldOverlayProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [showPlaceholder, setShowPlaceholder] = useState(!value);

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
    setShowPlaceholder(!value);
  }, [value]);

  useEffect(() => {
    if (saveState !== 'success') return;
    const timer = setTimeout(() => setSaveState('idle'), 1000);
    return () => clearTimeout(timer);
  }, [saveState]);

  return (
    <>
      {showPlaceholder && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: `${position.x}%`,
            top: `${position.y}%`,
            width: `${position.width}%`,
            height: `${position.height}%`,
            fontSize: `${position.fontSize}px`,
            textAlign: position.textAlign,
            zIndex: 1,
            color: '#9ca3af',
            pointerEvents: 'none',
            padding: '0 2px',
          }}
        >
          {label}
        </span>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        aria-label={label}
        title={label}
        style={{
          position: 'absolute',
          left: `${position.x}%`,
          top: `${position.y}%`,
          width: `${position.width}%`,
          minHeight: `${position.height}%`,
          fontSize: `${position.fontSize}px`,
          textAlign: position.textAlign,
          zIndex: 2,
          color: '#1a1a1a',
          padding: '0 2px',
        }}
        className={[
          'rounded px-1 outline-none transition',
          'hover:border hover:border-sky-300',
          'focus:border focus:border-blue-500',
          saveState === 'error' ? 'border border-red-500' : '',
        ].join(' ')}
        onFocus={() => setShowPlaceholder(false)}
        onBlur={async (event) => {
          const nextValue = event.currentTarget.innerText;
          setShowPlaceholder(!nextValue);
          if (nextValue === value) return;
          setSaveState('saving');
          try {
            await onSave(fieldKey, nextValue);
            setSaveState('success');
          } catch {
            event.currentTarget.innerText = value;
            setSaveState('error');
          }
        }}
      />
      {saveState === 'success' && (
        <span
          style={{
            position: 'absolute',
            left: `${position.x + position.width}%`,
            top: `${position.y}%`,
            zIndex: 3,
          }}
          className="text-xs text-emerald-600"
        >
          ✓
        </span>
      )}
    </>
  );
}

