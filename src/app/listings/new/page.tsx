'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { PropertyType, PROPERTY_TYPES, getPropertyType } from '@/lib/property-types';

type ListingStatus = 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready';
type FieldVisitStatus = 'draft' | 'field-visit-incomplete' | 'field-visit-complete';

interface Listing {
  id: number;
  property_type: PropertyType;
  field_visit_status: FieldVisitStatus;
  status: ListingStatus;
  field_visit_data: string | null;
  supplementary_data: string | null;
  generated_documents: string | null;
  created_at: string;
  updated_at: string;
}

export default function NewListingPage() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<PropertyType | null>(null);
  const nextStatus: ListingStatus = 'draft';

  const allTypeCards = useMemo(() => {
    return (Object.keys(PROPERTY_TYPES) as PropertyType[]).map((typeId) => {
      return getPropertyType(typeId) ?? PROPERTY_TYPES.farmland;
    });
  }, []);

  const previewListing: Listing | null = selectedType
    ? {
        id: 0,
        property_type: selectedType,
        field_visit_status: 'draft',
        status: nextStatus,
        field_visit_data: null,
        supplementary_data: null,
        generated_documents: null,
        created_at: '',
        updated_at: '',
      }
    : null;

  // TODO: API call for creating listing in Wave 2.
  const handleNextStep = async () => {
    if (!selectedType) return;
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyType: selectedType }),
    });
    if (!res.ok) return;
    const { listing } = await res.json();
    router.push(`/listings/${listing.id}/fill`);
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#2D3142] font-['Manrope']">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <h1 className="text-2xl font-bold text-[#1B3A6B]">新增物件</h1>
            <p className="mt-2 text-sm text-slate-600">先選物件類型，再進到下一步填資料。</p>
            <p className="mt-1 text-xs text-slate-500">
              {previewListing
                ? `已選：${getPropertyType(previewListing.property_type)?.displayName ?? previewListing.property_type}`
                : '尚未選擇物件類型'}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {allTypeCards.map((typeInfo) => {
                const isSelected = selectedType === typeInfo.id;
                const isAvailable = typeInfo.available;

                return (
                  <button
                    key={typeInfo.id}
                    type="button"
                    onClick={() => {
                      if (!isAvailable) {
                        return;
                      }
                      setSelectedType(typeInfo.id);
                    }}
                    disabled={!isAvailable}
                    className={[
                      'relative min-h-24 rounded-lg border p-4 text-left transition',
                      isAvailable ? 'cursor-pointer' : 'cursor-not-allowed',
                      isSelected
                        ? 'border-[#1B3A6B] bg-[#E8F0F9]'
                        : isAvailable
                          ? 'border-[#1B3A6B]/20 bg-white hover:border-[#1B3A6B]/50'
                          : 'border-slate-200 bg-[#F0F0F0] text-slate-400',
                    ].join(' ')}
                  >
                    <p className="text-base font-semibold">{typeInfo.displayName}</p>
                    <p className="mt-1 text-xs">類別：{typeInfo.category === 'land' ? '土地' : '建物'}</p>

                    {!isAvailable && (
                      <span className="absolute right-3 top-3 rounded-full bg-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        即將推出
                      </span>
                    )}

                    {isSelected && (
                      <span className="absolute bottom-3 right-3 text-sm font-bold text-[#1B3A6B]">✓ 已選擇</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled={!selectedType}
                onClick={handleNextStep}
                className={[
                  'rounded-md px-5 py-2.5 text-sm font-semibold text-white transition',
                  selectedType ? 'bg-[#1B3A6B] hover:bg-[#17325B]' : 'bg-slate-300',
                ].join(' ')}
              >
                下一步
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
