'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { PROPERTY_TYPES, type PropertyType } from '@/lib/property-types';

type CreatePreCommissionResponse = {
  id?: number;
  listing?: {
    id: number;
  };
};

type FormState = {
  owner_name: string;
  owner_phone: string;
  address: string;
  parcel_number: string;
  property_type: PropertyType;
  notes: string;
};

const DEFAULT_FORM_STATE: FormState = {
  owner_name: '',
  owner_phone: '',
  address: '',
  parcel_number: '',
  property_type: 'farmland',
  notes: '',
};

const getCreatedListingId = (payload: CreatePreCommissionResponse): number | null => {
  if (typeof payload.id === 'number') {
    return payload.id;
  }

  if (payload.listing && typeof payload.listing.id === 'number') {
    return payload.listing.id;
  }

  return null;
};

export default function NewPreCommissionPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const propertyTypeOptions = useMemo(() => {
    return (Object.keys(PROPERTY_TYPES) as PropertyType[])
      .map((typeId) => PROPERTY_TYPES[typeId])
      .filter((typeInfo) => typeInfo.available);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.owner_name.trim() || !formState.owner_phone.trim() || !formState.address.trim()) {
      setErrorMessage('請先填完所有必填欄位');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/pre-commission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner_name: formState.owner_name.trim(),
          owner_phone: formState.owner_phone.trim(),
          address: formState.address.trim(),
          parcel_number: formState.parcel_number.trim(),
          property_type: formState.property_type,
          notes: formState.notes.trim(),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? '建立失敗，請稍後再試');
      }

      const payload = (await response.json()) as CreatePreCommissionResponse;
      const listingId = getCreatedListingId(payload);

      if (!listingId) {
        throw new Error('建立成功但找不到物件編號');
      }

      router.push(`/pre-commission/${listingId}`);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : '建立失敗，請稍後再試';
      setErrorMessage(message);
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
            <h1 className="text-2xl font-bold text-[#1B3A6B]">新增屋主建案</h1>
            <p className="mt-2 text-sm text-slate-600">先建 pre-commission 案件，再進一步做公開資料與謄本整理。</p>

            <form onSubmit={(event) => void handleSubmit(event)} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                  屋主姓名<span className="text-red-500">*</span>
                  <input
                    value={formState.owner_name}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        owner_name: event.target.value,
                      }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B]"
                    placeholder="請輸入屋主姓名"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                  屋主電話<span className="text-red-500">*</span>
                  <input
                    value={formState.owner_phone}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        owner_phone: event.target.value,
                      }))
                    }
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B]"
                    placeholder="請輸入屋主電話"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                房屋地址<span className="text-red-500">*</span>
                <input
                  value={formState.address}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      address: event.target.value,
                    }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B]"
                  placeholder="請輸入完整地址"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                地段地號
                <input
                  value={formState.parcel_number}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      parcel_number: event.target.value,
                    }))
                  }
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B]"
                  placeholder="如：台南市永康區 xxx 段 xxx 地號"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                物件類型<span className="text-red-500">*</span>
                <select
                  value={formState.property_type}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      property_type: event.target.value as PropertyType,
                    }))
                  }
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B]"
                >
                  {propertyTypeOptions.map((typeInfo) => (
                    <option key={typeInfo.id} value={typeInfo.id}>
                      {typeInfo.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                備註
                <textarea
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      notes: event.target.value,
                    }))
                  }
                  rows={4}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-[#1B3A6B]"
                  placeholder="可補充委託背景、時間限制、聯絡偏好等"
                />
              </label>

              <div className="flex items-center justify-end gap-3">
                {errorMessage && <span className="text-sm text-red-600">{errorMessage}</span>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-[#1B3A6B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#17325B] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? '建立中...' : '建立案件'}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
