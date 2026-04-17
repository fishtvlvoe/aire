'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import SupplementaryForm from '@/components/forms/SupplementaryForm';
import { PROPERTY_TYPES, getPropertyType, type PropertyType } from '@/lib/property-types';

type Listing = {
  id: number;
  property_type: PropertyType;
  address: string;
  status: string;
  field_visit_data?: string | null;
  supplementary_data?: string | null;
};

type ListingResponse = {
  listing: Listing;
};

const parseJsonObject = (rawData: string | null): Record<string, unknown> | null => {
  if (!rawData) {
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

const getAddressFromListing = (listing: Listing | null): string => {
  if (!listing) {
    return '-';
  }
  const fieldVisitData = parseJsonObject(listing.field_visit_data);
  const address = fieldVisitData?.address;
  if (typeof address === 'string' && address.trim() !== '') {
    return address;
  }
  return '地址尚未填寫';
};

export default function ListingSupplementaryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = Number(params.id ?? '0');

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (Number.isNaN(listingId)) {
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
    return getPropertyType(listing.property_type)?.displayName ?? PROPERTY_TYPES[listing.property_type].displayName;
  }, [listing]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    if (!listing) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/listings/${listing.id}/supplementary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
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
                  onSubmit={(data) => {
                    void handleSubmit(data);
                  }}
                  onGenerateDocuments={() => {}}
                />

                <div className="mt-4 flex items-center justify-end gap-3">
                  {submitError && <span className="text-sm text-red-600">{submitError}</span>}
                  {submitting && <span className="text-sm text-slate-500">儲存中...</span>}
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
