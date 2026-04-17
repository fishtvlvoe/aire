'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getListing, Listing, ListingStatus, PropertyType, PROPERTY_TYPES } from '@/lib/db';
import { getPropertyType } from '@/lib/property-types';

type DocumentId =
  | 'property_dossier'
  | 'listing_591'
  | 'sales_dm'
  | 'social_posts'
  | 'short_video_script'
  | 'placeholder_one'
  | 'placeholder_two';

type DocumentMeta = {
  id: DocumentId;
  title: string;
  description: string;
  hasPdf: boolean;
};

type DocumentCard = DocumentMeta & {
  preview: string | null;
};

const listingStatusLabels: Record<ListingStatus, string> = {
  draft: '草稿',
  'field-visit-complete': '場勘完成',
  'ready-for-generation': '可產生文件',
  'documents-ready': '文件已產出',
};

const documentCatalog: DocumentMeta[] = [
  { id: 'property_dossier', title: '物件調查表', description: '完整物件資料與現場勘查記錄', hasPdf: true },
  { id: 'listing_591', title: '591刊登文案', description: '主平台刊登文案摘要', hasPdf: false },
  { id: 'sales_dm', title: '銷售DM', description: '平面與數位宣傳素材', hasPdf: false },
  { id: 'social_posts', title: '社群貼文', description: '社群宣傳短文與 Hashtag', hasPdf: false },
  { id: 'short_video_script', title: '短影音腳本', description: '15-30 秒短影音分鏡文案', hasPdf: false },
  { id: 'placeholder_one', title: 'AI 話術整理', description: '占位：話術與重點整理', hasPdf: false },
  { id: 'placeholder_two', title: '帶看重點摘要', description: '占位：帶看流程重點', hasPdf: false },
];

export default function ListingDocumentsPage() {
  const params = useParams<{ id: string }>();
  const listingId = Number(params.id ?? '0');
  const listingFromDb = useMemo(() => {
    if (Number.isNaN(listingId)) {
      return undefined;
    }
    return getListing(listingId);
  }, [listingId]);

  const fallbackType: PropertyType = listingFromDb?.property_type ?? 'farmland';
  const listingPreview: Listing =
    listingFromDb ?? ({
      id: Number.isNaN(listingId) ? 0 : listingId,
      property_type: fallbackType,
      field_visit_status: 'field-visit-complete',
      status: 'documents-ready',
      field_visit_data: null,
      supplementary_data: null,
      generated_documents: null,
      created_at: '',
      updated_at: '',
    } as Listing);

  const typeName = getPropertyType(listingPreview.property_type)?.displayName ?? PROPERTY_TYPES[fallbackType].displayName;

  const [previewState] = useState<Record<DocumentId, string | null>>(() => ({
    property_dossier: '地號 112-3，臨路 6 米，面寬 14 米。',
    listing_591: '南屯精華地段農地，近交流道，交通便利。',
    sales_dm: '主打大面寬、好規劃、置產自用皆宜。',
    social_posts: '【精選釋出】稀有大面寬農地，投資首選。',
    short_video_script: '開場 3 秒抓眼球，帶出地段與潛力。',
    placeholder_one: null,
    placeholder_two: null,
  }));

  const documentCards = useMemo<DocumentCard[]>(() => {
    return documentCatalog.map((doc) => ({
      ...doc,
      preview: previewState[doc.id],
    }));
  }, [previewState]);

  const handlePlaceholderAction = async (documentId: DocumentId, action: 'download' | 'pdf' | 'regenerate') => {
    // TODO: 下載與重新產生邏輯串接 API。
    await Promise.resolve({ documentId, action });
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#2D3142] font-['Manrope']">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#1B3A6B]">文件輸出</h1>
              <p className="mt-2 text-sm text-slate-600">
                物件編號：#{listingPreview.id || '待建立'} ｜ 類型：{typeName} ｜ 狀態：
                {listingStatusLabels[listingPreview.status]}
              </p>
              <p className="mt-1 text-xs text-slate-500">共 7 份文件可下載，含 1 份 PDF 版本。</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {documentCards.map((card) => (
                <article
                  key={card.id}
                  className="flex min-h-56 flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(45,49,66,0.06)]"
                >
                  <header className="mb-3">
                    <h2 className="text-base font-semibold text-[#1B3A6B]">{card.title}</h2>
                    <p className="mt-1 text-xs text-slate-500">{card.description}</p>
                  </header>

                  <div className="flex-1 rounded-md bg-[#F9FAFB] p-3 text-sm text-slate-700">
                    {card.preview ?? <span className="text-slate-400">尚未產生內容</span>}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handlePlaceholderAction(card.id, 'download')}
                      className="rounded-md border border-[#1B3A6B] px-3 py-1.5 text-sm font-semibold text-[#1B3A6B]"
                    >
                      下載
                    </button>

                    {card.hasPdf && (
                      <button
                        type="button"
                        onClick={() => void handlePlaceholderAction(card.id, 'pdf')}
                        className="rounded-md border border-[#F5882B] px-3 py-1.5 text-sm font-semibold text-[#F5882B]"
                      >
                        下載 PDF
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => void handlePlaceholderAction(card.id, 'regenerate')}
                      className="rounded-md bg-[#1B3A6B] px-3 py-1.5 text-sm font-semibold text-white"
                    >
                      重新產生
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
