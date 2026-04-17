'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { Listing, ListingStatus, PropertyType, PROPERTY_TYPES } from '@/lib/db';
import { getPropertyType } from '@/lib/property-types';

type ListingRow = Listing & {
  address: string;
  ownerAgent: string;
  entrustedDate: string;
};

const statusLabels: Record<ListingStatus, string> = {
  draft: '草稿',
  'field-visit-complete': '場勘完成',
  'ready-for-generation': '可產生文件',
  'documents-ready': '文件已產出',
};

const listingRows: ListingRow[] = [
  {
    id: 101,
    property_type: 'farmland',
    field_visit_status: 'draft',
    status: 'draft',
    field_visit_data: null,
    supplementary_data: null,
    generated_documents: null,
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-01T00:00:00.000Z',
    address: '台中市南屯區忠勇路 120 號',
    ownerAgent: '王小華',
    entrustedDate: '2026-04-01',
  },
  {
    id: 102,
    property_type: 'townhouse',
    field_visit_status: 'field-visit-complete',
    status: 'ready-for-generation',
    field_visit_data: null,
    supplementary_data: null,
    generated_documents: null,
    created_at: '2026-04-02T00:00:00.000Z',
    updated_at: '2026-04-02T00:00:00.000Z',
    address: '台中市北屯區松竹路 88 號',
    ownerAgent: '林建民',
    entrustedDate: '2026-04-02',
  },
  {
    id: 103,
    property_type: 'apartment',
    field_visit_status: 'field-visit-complete',
    status: 'documents-ready',
    field_visit_data: null,
    supplementary_data: null,
    generated_documents: null,
    created_at: '2026-04-03T00:00:00.000Z',
    updated_at: '2026-04-03T00:00:00.000Z',
    address: '台中市西屯區文心路 300 號',
    ownerAgent: '陳雅婷',
    entrustedDate: '2026-04-03',
  },
];

function ActionCell({ row }: { row: ListingRow }) {
  if (row.status === 'draft') {
    return (
      <Link href={`/listings/${row.id}/fill`} className="text-[#1B3A6B] hover:underline">
        繼續填寫
      </Link>
    );
  }

  if (row.status === 'ready-for-generation') {
    return (
      <button
        type="button"
        disabled
        className="rounded-md bg-[#1B3A6B] px-3 py-1.5 text-sm text-white opacity-50"
      >
        產生文件
      </button>
    );
  }

  if (row.status === 'documents-ready') {
    return (
      <Link href={`/listings/${row.id}/documents`} className="text-[#1B3A6B] hover:underline">
        查看文件
      </Link>
    );
  }

  return <span className="text-slate-400">—</span>;
}

export default function ListingsPage() {
  const [typeFilter, setTypeFilter] = useState<'all' | PropertyType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ListingStatus>('all');

  const filteredRows = useMemo(() => {
    return listingRows.filter((row) => {
      const matchType = typeFilter === 'all' ? true : row.property_type === typeFilter;
      const matchStatus = statusFilter === 'all' ? true : row.status === statusFilter;
      return matchType && matchStatus;
    });
  }, [statusFilter, typeFilter]);

  const propertyTypeOptions = Object.values(PROPERTY_TYPES);

  return (
    <div className="min-h-screen bg-[#F5F6FA] text-[#2D3142] font-['Manrope']">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-[#1B3A6B]">物件列表</h1>

              <div className="flex flex-wrap gap-3">
                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as 'all' | PropertyType)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">全部</option>
                  {propertyTypeOptions.map((typeInfo) => (
                    <option key={typeInfo.id} value={typeInfo.id}>
                      {typeInfo.displayName}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'all' | ListingStatus)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">全部</option>
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-[#F9FAFB] text-left text-[#1B3A6B]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">物件地址</th>
                    <th className="px-4 py-3 font-semibold">物件類型</th>
                    <th className="px-4 py-3 font-semibold">狀態</th>
                    <th className="px-4 py-3 font-semibold">業務</th>
                    <th className="px-4 py-3 font-semibold">委託日期</th>
                    <th className="px-4 py-3 font-semibold">操作</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredRows.map((row) => {
                    const typeInfo = getPropertyType(row.property_type);

                    return (
                      <tr key={row.id} className="bg-white">
                        <td className="px-4 py-3">{row.address}</td>
                        <td className="px-4 py-3">{typeInfo?.displayName ?? row.property_type}</td>
                        <td className="px-4 py-3">{statusLabels[row.status]}</td>
                        <td className="px-4 py-3">{row.ownerAgent}</td>
                        <td className="px-4 py-3">{row.entrustedDate}</td>
                        <td className="px-4 py-3">
                          <ActionCell row={row} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
