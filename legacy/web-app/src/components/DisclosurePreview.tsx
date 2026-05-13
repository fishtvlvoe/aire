'use client';

import { useEffect, useMemo, useState } from 'react';
import DisclosureFieldOverlay from '@/components/DisclosureFieldOverlay';

type FieldPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
};

export type DisclosurePreviewField = {
  fieldKey: string;
  label: string;
  value: string;
  page: 'cover' | 'content';
  position: FieldPosition;
};

export type DisclosurePreviewBackgrounds = {
  cover: string | null;
  content: string | null;
};

interface DisclosurePreviewProps {
  fields: DisclosurePreviewField[];
  backgrounds: DisclosurePreviewBackgrounds;
  listingId: number;
  onSave: (fieldKey: string, value: string) => Promise<void>;
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

function PreviewPage({
  page,
  fields,
  backgroundUrl,
  scale,
  onSave,
}: {
  page: 'cover' | 'content';
  fields: DisclosurePreviewField[];
  backgroundUrl: string | null;
  scale: number;
  onSave: (fieldKey: string, value: string) => Promise<void>;
}) {
  return (
    <section
      className="origin-top rounded-lg border border-slate-200 bg-white shadow-sm"
      style={{
        width: `${A4_WIDTH}px`,
        height: `${A4_HEIGHT}px`,
        position: 'relative',
        transform: `scale(${scale})`,
        marginBottom: `${Math.max(0, A4_HEIGHT * (1 - scale))}px`,
      }}
    >
      {backgroundUrl ? (
        <img
          src={backgroundUrl}
          alt={`${page} background`}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ zIndex: 0 }}
        />
      ) : null}
      <div className="absolute inset-0" style={{ zIndex: 1 }}>
        {fields.map((field) => (
          <DisclosureFieldOverlay
            key={`${page}-${field.fieldKey}`}
            fieldKey={field.fieldKey}
            label={field.label}
            value={field.value}
            position={field.position}
            onSave={onSave}
          />
        ))}
      </div>
    </section>
  );
}

export default function DisclosurePreview({
  listingId,
  fields,
  backgrounds,
  onSave,
}: DisclosurePreviewProps) {
  const [viewportWidth, setViewportWidth] = useState<number>(A4_WIDTH);

  useEffect(() => {
    const updateViewport = () => setViewportWidth(window.innerWidth);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const scale = useMemo(() => {
    if (viewportWidth >= A4_WIDTH) {
      return 1;
    }
    return Math.max(0.35, viewportWidth / A4_WIDTH);
  }, [viewportWidth]);

  const coverFields = fields.filter((field) => field.page === 'cover');
  const contentFields = fields.filter((field) => field.page === 'content');

  return (
    <div className="flex flex-col items-center gap-8" data-listing-id={listingId}>
      <PreviewPage
        page="cover"
        fields={coverFields}
        backgroundUrl={backgrounds.cover}
        scale={scale}
        onSave={onSave}
      />
      {(contentFields.length > 0 || backgrounds.content) && (
        <PreviewPage
          page="content"
          fields={contentFields}
          backgroundUrl={backgrounds.content}
          scale={scale}
          onSave={onSave}
        />
      )}
    </div>
  );
}
