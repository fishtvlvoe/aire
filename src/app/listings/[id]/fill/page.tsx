'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Listing, ListingStatus, PropertyType, PROPERTY_TYPES } from '@/lib/db';
import { getPropertyType } from '@/lib/property-types';

type TabKey = 'common' | 'typeSpecific' | 'supplementary';
type CompletionState = 'complete' | 'partial' | 'empty';

type TabConfig = {
  key: TabKey;
  label: string;
  completion: CompletionState;
};

const completionStyles: Record<CompletionState, { text: string; color: string }> = {
  complete: { text: '✓ 完成', color: 'text-emerald-600' },
  partial: { text: '◐ 部分', color: 'text-[#F5882B]' },
  empty: { text: '○ 未填', color: 'text-slate-400' },
};

const statusLabels: Record<ListingStatus, string> = {
  draft: '草稿',
  'field-visit-complete': '場勘完成',
  'ready-for-generation': '可產生文件',
  'documents-ready': '文件已產出',
};

function PlaceholderFields({ fields }: { fields: string[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {fields.map((fieldName) => (
        <label key={fieldName} className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-700">{fieldName}</span>
          <input
            type="text"
            placeholder={`請輸入${fieldName}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#1B3A6B]"
          />
        </label>
      ))}
    </div>
  );
}

export default function ListingFillPage() {
  const params = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabKey>('common');
  const [selectedType] = useState<PropertyType>('farmland');

  const listingPreview: Listing = {
    id: Number(params.id ?? '0'),
    property_type: selectedType,
    field_visit_status: 'draft',
    status: 'draft',
    field_visit_data: null,
    supplementary_data: null,
    generated_documents: null,
    created_at: '',
    updated_at: '',
  };

  const typeName = getPropertyType(selectedType)?.displayName ?? PROPERTY_TYPES.farmland.displayName;

  const tabs = useMemo<TabConfig[]>(() => {
    return [
      { key: 'common', label: '共通欄位', completion: 'partial' },
      { key: 'typeSpecific', label: '類型專屬欄位', completion: 'empty' },
      { key: 'supplementary', label: '秘書後補', completion: 'complete' },
    ];
  }, []);

  const commonFields = ['委託總價', '物件地址', '用途', '現況', '優缺點'];
  const specificFields = [`${typeName}欄位 A`, `${typeName}欄位 B`, `${typeName}欄位 C`];
  const supplementaryFields = ['建物謄本補件', '稅務資訊補件', '行銷備註'];

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#2D3142] font-['Manrope']">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#1B3A6B]">資料填寫</h1>
              <p className="mt-2 text-sm text-slate-600">
                物件編號：#{listingPreview.id || '待建立'} ｜ 類型：{typeName} ｜ 狀態：{statusLabels[listingPreview.status]}
              </p>
            </div>

            <div className="mb-5 flex flex-wrap gap-3">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={[
                    'rounded-md border px-4 py-2 text-sm transition',
                    activeTab === tab.key
                      ? 'border-[#1B3A6B] bg-[#E8F0F9] text-[#1B3A6B]'
                      : 'border-slate-200 bg-white text-slate-600',
                  ].join(' ')}
                >
                  <span className="mr-2 font-semibold">{tab.label}</span>
                  <span className={completionStyles[tab.completion].color}>{completionStyles[tab.completion].text}</span>
                </button>
              ))}
            </div>

            {activeTab === 'common' && <PlaceholderFields fields={commonFields} />}

            {activeTab === 'typeSpecific' && (
              <div>
                <p className="mb-3 text-sm font-semibold text-[#1B3A6B]">{typeName}欄位</p>
                <PlaceholderFields fields={specificFields} />
              </div>
            )}

            {activeTab === 'supplementary' && (
              <div className="rounded-lg bg-[#F9FAFB] p-4">
                <PlaceholderFields fields={supplementaryFields} />
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                disabled
                className="rounded-md bg-[#1B3A6B] px-5 py-2.5 text-sm font-semibold text-white opacity-50"
              >
                產生文件
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
