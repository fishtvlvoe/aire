'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Listing, ListingStatus, PropertyType, PROPERTY_TYPES } from '@/lib/db';
import { getPropertyType } from '@/lib/property-types';

type DocumentStatus = 'done' | 'in-progress' | 'waiting';

type DocumentItem = {
  id: string;
  label: string;
  status: DocumentStatus;
};

const statusBadge: Record<DocumentStatus, { icon: string; text: string; className: string }> = {
  done: { icon: '✅', text: '已完成', className: 'text-emerald-600' },
  'in-progress': { icon: '🔄', text: '產生中...', className: 'text-[#F5882B]' },
  waiting: { icon: '⏳', text: '等待中', className: 'text-slate-500' },
};

const listingStatusLabels: Record<ListingStatus, string> = {
  draft: '草稿',
  'field-visit-complete': '場勘完成',
  'ready-for-generation': '可產生文件',
  'documents-ready': '文件已產出',
};

export default function ListingGeneratingPage() {
  const params = useParams<{ id: string }>();
  const [propertyType] = useState<PropertyType>('farmland');

  const listingPreview: Listing = {
    id: Number(params.id ?? '0'),
    property_type: propertyType,
    field_visit_status: 'field-visit-complete',
    status: 'ready-for-generation',
    field_visit_data: null,
    supplementary_data: null,
    generated_documents: null,
    created_at: '',
    updated_at: '',
  };

  const documents = useMemo<DocumentItem[]>(() => {
    return [
      { id: 'dossier', label: '物件調查表', status: 'waiting' },
      { id: 'listing-591', label: '591刊登文案', status: 'waiting' },
      { id: 'sales-dm', label: '銷售DM', status: 'waiting' },
      { id: 'social-post', label: '社群貼文', status: 'waiting' },
      { id: 'short-video', label: '短影音腳本', status: 'waiting' },
      { id: 'placeholder-1', label: 'AI 話術整理', status: 'waiting' },
      { id: 'placeholder-2', label: '帶看重點摘要', status: 'waiting' },
    ];
  }, []);

  const doneCount = documents.filter((doc) => doc.status === 'done').length;
  const progress = Math.round((doneCount / documents.length) * 100);
  const typeName = getPropertyType(propertyType)?.displayName ?? PROPERTY_TYPES.farmland.displayName;

  // TODO: API call in Wave 2 - use async polling to update document statuses.

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#2D3142] font-['Manrope']">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <h1 className="text-2xl font-bold text-[#1B3A6B]">AI 文件產生中</h1>
            <p className="mt-2 text-sm text-slate-600">
              物件編號：#{listingPreview.id || '待建立'} ｜ 類型：{typeName} ｜ 當前狀態：
              {listingStatusLabels[listingPreview.status]}
            </p>

            <div className="mt-6 rounded-lg bg-[#F9FAFB] p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold">整體進度</span>
                <span>
                  已完成 {doneCount}/{documents.length}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full bg-[#F5882B] transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">預估剩餘時間：大約 3 分鐘（暫定）</p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              {documents.map((doc) => {
                const badge = statusBadge[doc.status];
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                  >
                    <p className="font-semibold">{doc.label}</p>
                    <p className={`text-sm ${badge.className}`}>
                      <span className="mr-1">{badge.icon}</span>
                      {badge.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
