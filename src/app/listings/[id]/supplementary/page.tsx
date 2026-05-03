'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SupplementaryForm from '@/components/forms/SupplementaryForm';
import Stepper from '@/components/Stepper';
import MarketLookupPanel from '@/components/MarketLookupPanel';
import { PROPERTY_TYPES, getPropertyType, type PropertyType } from '@/lib/property-types';
import type { AttachmentMeta } from '@/lib/db';

type Listing = {
  id: number;
  property_type: PropertyType;
  address: string;
  status: string;
  field_visit_data?: string | null;
  supplementary_data?: string | null;
  pre_commission_data?: string | Record<string, unknown> | null;
  market_summary?: string | null;
  attachments?: string | null;
};

type ListingResponse = {
  listing: Listing;
};

const parseJsonObject = (rawData: unknown): Record<string, unknown> | null => {
  if (!rawData) {
    return null;
  }

  if (typeof rawData === 'object') {
    return rawData as Record<string, unknown>;
  }

  if (typeof rawData !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(rawData) as unknown;
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

const parseAttachments = (raw: string | null | undefined): AttachmentMeta[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as AttachmentMeta[]) : [];
  } catch {
    return [];
  }
};

const getAddressFromListing = (listing: Listing | null): string => {
  if (!listing) {
    return '-';
  }
  const fieldVisitData = parseJsonObject(listing.field_visit_data ?? null);
  const address = fieldVisitData?.address;
  if (typeof address === 'string' && address.trim() !== '') {
    return address;
  }
  return '地址尚未填寫';
};

// ─── Accordion Panel Types ────────────────────────────────────────────────────

type AccordionPanelDef = {
  id: string;
  title: string;
  fields: { key: string; label: string }[];
};

const ACCORDION_PANELS: AccordionPanelDef[] = [
  {
    id: 'identity',
    title: '身份資訊',
    fields: [
      { key: 'company_name', label: '公司名稱' },
      { key: 'property_name', label: '物件名稱' },
      { key: 'case_number', label: '案件編號' },
      { key: 'agent_name', label: '業務員姓名' },
      { key: 'agent_phone', label: '業務員電話' },
    ],
  },
  {
    id: 'transaction',
    title: '交易資訊',
    fields: [
      { key: 'sale_price_text', label: '成交價（萬元）' },
      { key: 'transaction_type', label: '交易方式' },
      { key: 'deed_fee_split', label: '代書費負擔方式' },
      { key: 'other_terms', label: '其他條款' },
    ],
  },
  {
    id: 'building',
    title: '建物補充',
    fields: [
      { key: 'ancillary_building_area', label: '附屬建物面積' },
      { key: 'common_area_ping', label: '共有部分（坪）' },
      { key: 'land_use_zone', label: '使用分區' },
      { key: 'announced_land_value', label: '公告現值' },
    ],
  },
  {
    id: 'surroundings',
    title: '周遭機能',
    fields: [
      { key: 'school_distance', label: '鄰近學校距離' },
      { key: 'park_distance', label: '鄰近公園距離' },
      { key: 'transport_description', label: '交通便利性說明' },
      { key: 'shopping_description', label: '購物便利性說明' },
    ],
  },
];

// ─── Accordion Panel Component ────────────────────────────────────────────────

type AccordionPanelProps = {
  panel: AccordionPanelDef;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
};

function AccordionPanel({ panel, values, onChange }: AccordionPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <span>{panel.title}</span>
        <span className="text-slate-500">{open ? '▼' : '▶'}</span>
      </button>

      {open && (
        <div className="grid grid-cols-1 gap-4 px-4 pb-4 pt-2 lg:grid-cols-2">
          {panel.fields.map((field) => (
            <label key={field.key} className="block text-sm font-medium text-slate-700">
              {field.label}
              <input
                type="text"
                name={field.key}
                value={values[field.key] ?? ''}
                onChange={(e) => onChange(field.key, e.target.value)}
                placeholder={`請輸入${field.label}`}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ListingSupplementaryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = Number(params.id ?? 'NaN');

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Extra fields state — keyed by field.key across all 4 panels
  const [accordionFields, setAccordionFields] = useState<Record<string, string>>({});

  useEffect(() => {
    if (Number.isNaN(listingId) || listingId <= 0) {
      setLoadError('物件編號錯誤');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadListing = async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}`);
        if (!response.ok) {
          throw new Error('讀取物件資料失敗');
        }
        const payload = (await response.json()) as ListingResponse;
        if (!isMounted) {
          return;
        }
        setListing(payload.listing);

        // Populate accordion fields from saved supplementary_data
        const suppData = parseJsonObject(payload.listing.supplementary_data ?? null);
        if (suppData) {
          const allKeys = ACCORDION_PANELS.flatMap((p) => p.fields.map((f) => f.key));
          const initial: Record<string, string> = {};
          for (const key of allKeys) {
            const val = suppData[key];
            if (val !== undefined && val !== null) {
              initial[key] = String(val);
            }
          }
          setAccordionFields(initial);
        }
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }
        const message =
          caughtError instanceof Error ? caughtError.message : '讀取物件資料失敗，請稍後再試';
        setLoadError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadListing();

    return () => {
      isMounted = false;
    };
  }, [listingId]);

  const propertyTypeLabel = useMemo(() => {
    if (!listing) {
      return '-';
    }
    return getPropertyType(listing.property_type)?.displayName ?? PROPERTY_TYPES[listing.property_type]?.displayName ?? '未知類型';
  }, [listing]);

  const preCommissionData = useMemo(() => {
    return parseJsonObject(listing?.pre_commission_data);
  }, [listing?.pre_commission_data]);

  const updateAccordionField = (key: string, value: string) => {
    setAccordionFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!listing) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    // Merge accordion fields into form payload (always write, even empty, so users can clear saved values)
    const mergedData: Record<string, unknown> = { ...data };
    for (const [key, value] of Object.entries(accordionFields)) {
      mergedData[key] = value.trim();
    }

    try {
      const response = await fetch(`/api/listings/${listing.id}/supplementary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: mergedData }),
      });

      if (!response.ok) {
        throw new Error('儲存失敗，請稍後再試');
      }

      router.push(`/listings/${listing.id}/generating`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '儲存失敗，請稍後再試';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F6FA] font-['Manrope'] text-[#2D3142]">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-4">
            <Stepper
              currentStep={3}
              listingId={listing?.id ?? null}
              listingStatus={(listing?.status as 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready' | undefined) ?? null}
            />
          </div>

          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h1 className="text-2xl font-bold text-[#1B3A6B]">補件資料</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <span className="rounded-full bg-white px-3 py-1">物件編號：#{listing?.id ?? '-'}</span>
                <span className="rounded-full bg-white px-3 py-1">物件地址：{getAddressFromListing(listing)}</span>
                <span className="rounded-full bg-white px-3 py-1">類型：{propertyTypeLabel}</span>
              </div>
            </div>

            {loading && <p className="py-8 text-center text-sm text-slate-500">讀取中...</p>}

            {!loading && loadError && (
              <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{loadError}</p>
            )}

            {!loading && !loadError && listing && (
              <>
                <SupplementaryForm
                  propertyType={listing.property_type}
                  preCommissionData={preCommissionData}
                  onSubmit={(data) => {
                    void handleSubmit(data);
                  }}
                  onGenerateDocuments={() => {}}
                />

                {/* 4 Accordion Panels — optional supplementary fields */}
                <div className="mt-6 flex flex-col gap-3">
                  {ACCORDION_PANELS.map((panel) => (
                    <AccordionPanel
                      key={panel.id}
                      panel={panel}
                      values={accordionFields}
                      onChange={updateAccordionField}
                    />
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-end gap-3">
                  {submitError && <span className="text-sm text-red-600">{submitError}</span>}
                  {submitting && <span className="text-sm text-slate-500">儲存中...</span>}
                </div>

                <div className="mt-6">
                  <MarketLookupPanel
                    listingId={listing.id}
                    address={getAddressFromListing(listing)}
                    initialMarketSummary={listing.market_summary ?? null}
                    initialAttachments={parseAttachments(listing.attachments)}
                  />
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
