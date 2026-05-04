'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import FolderSidebar, { type Folder, type FolderSel } from '@/components/FolderSidebar';
import SearchBar from '@/components/SearchBar';
import Sidebar from '@/components/Sidebar';
import { PROPERTY_TYPES, getPropertyType, type PropertyType } from '@/lib/property-types';
import { resolveListingActionLabel, resolveListingHref, resolveListingSecondaryAction } from '@/lib/listing-routes';

type ListingStatus = 'draft' | 'field-visit-complete' | 'ready-for-generation' | 'documents-ready';
type Listing = {
  id: number;
  property_type: PropertyType;
  address: string;
  status: ListingStatus;
  field_visit_data?: string | null;
  created_at?: string;
  folder_id?: number | null;
  archived_at?: string | null;
  owner_id?: number | null;
};

type ListingStatusOption = { label: string; className: string };

const statusOptions: Record<ListingStatus, ListingStatusOption> = {
  draft: { label: '草稿', className: 'bg-slate-100 text-slate-700' },
  'field-visit-complete': { label: '場勘完成', className: 'bg-blue-100 text-blue-700' },
  'ready-for-generation': { label: '可產生文件', className: 'bg-yellow-100 text-yellow-700' },
  'documents-ready': { label: '已產出', className: 'bg-emerald-100 text-emerald-700' },
};

const parseFieldVisitData = (rawData: string | null): Record<string, unknown> | null => {
  if (!rawData) return null;
  try {
    const parsed = JSON.parse(rawData) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch { return null; }
};

const getAddressFromListing = (listing: Listing): string => {
  const fvd = parseFieldVisitData(listing.field_visit_data ?? null);
  const addr = fvd?.address;
  if (typeof addr === 'string' && addr.trim()) return addr;
  return '地址尚未填寫';
};

const formatDate = (isoDate: string | undefined): string => {
  if (!isoDate) return '-';
  const d = new Date(isoDate);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('zh-TW');
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | PropertyType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ListingStatus>('all');
  const [selectedFolder, setSelectedFolder] = useState<FolderSel>(null);
  const [archivedView, setArchivedView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);

  const loadListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (archivedView) {
        params.set('archived', 'true');
      } else if (includeArchived) {
        params.set('archived', 'all');
      }
      if (!archivedView) {
        if (selectedFolder === 'none') params.set('folder_id', 'none');
        else if (typeof selectedFolder === 'number') params.set('folder_id', String(selectedFolder));
      }
      const res = await fetch(`/api/listings?${params.toString()}`);
      if (!res.ok) throw new Error('讀取物件資料失敗');
      const payload = (await res.json()) as { listings: Listing[] };
      setListings(payload.listings);
    } catch (e) {
      setError(e instanceof Error ? e.message : '讀取物件資料失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, archivedView, includeArchived, selectedFolder]);

  useEffect(() => { void loadListings(); }, [loadListings]);

  async function handleDelete(id: number) {
    if (!window.confirm('確定刪除此物件？此操作無法復原')) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? '刪除失敗');
      }
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      alert('刪除失敗：' + (e as Error).message);
    }
  }

  async function handleArchive(id: number) {
    const res = await fetch(`/api/listings/${id}/archive`, { method: 'POST' });
    if (res.ok) setListings(prev => prev.filter(l => l.id !== id));
    else { const d = (await res.json()) as { error?: string }; alert(d.error ?? '封存失敗'); }
  }

  async function handleRestore(id: number) {
    const res = await fetch(`/api/listings/${id}/restore`, { method: 'POST' });
    if (res.ok) setListings(prev => prev.filter(l => l.id !== id));
    else { const d = (await res.json()) as { error?: string }; alert(d.error ?? '還原失敗'); }
  }

  async function handleMoveFolder(listingId: number, folderId: number | null) {
    const res = await fetch(`/api/listings/${listingId}/folder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId }),
    });
    if (res.ok) {
      const d = (await res.json()) as { listing: Listing };
      setListings(prev => prev.map(l => l.id === listingId ? { ...l, folder_id: d.listing.folder_id } : l));
    } else {
      const d = (await res.json()) as { error?: string };
      alert(d.error ?? '移動失敗');
    }
  }

  const filteredRows = useMemo(() => {
    return listings.filter((listing) => {
      const matchType = typeFilter === 'all' || listing.property_type === typeFilter;
      const matchStatus = statusFilter === 'all' || listing.status === statusFilter;
      return matchType && matchStatus;
    });
  }, [listings, statusFilter, typeFilter]);

  const propertyTypeOptions = Object.values(PROPERTY_TYPES);

  return (
    <div className="min-h-screen bg-[#F5F6FA] font-['Manrope'] text-[#2D3142]">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <FolderSidebar
          selected={selectedFolder}
          archivedView={archivedView}
          onSelect={(sel) => { setSelectedFolder(sel); setArchivedView(false); }}
          onSelectArchive={() => { setArchivedView(true); setSelectedFolder(null); }}
          onFoldersChange={setFolders}
        />

        <main className="flex-1 p-8 min-w-0">
          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h1 className="text-2xl font-bold text-[#1B3A6B]">
                {archivedView ? '封存區' : '物件列表'}
              </h1>

              <div className="flex flex-wrap gap-3">
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as 'all' | PropertyType)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">全部類型</option>
                  {propertyTypeOptions.map(t => (
                    <option key={t.id} value={t.id}>{t.displayName}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as 'all' | ListingStatus)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">全部狀態</option>
                  {(Object.keys(statusOptions) as ListingStatus[]).map(s => (
                    <option key={s} value={s}>{statusOptions[s].label}</option>
                  ))}
                </select>

                {!archivedView && (
                  <Link
                    href="/listings/new"
                    className="rounded-md bg-[#1B3A6B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#17325B]"
                  >
                    新增物件
                  </Link>
                )}
              </div>
            </div>

            <div className="mb-4">
              <SearchBar
                onSearch={setSearchQuery}
                includeArchived={includeArchived}
                onToggleArchived={setIncludeArchived}
                showArchivedToggle={!archivedView}
              />
            </div>

            {loading && <p className="py-8 text-center text-sm text-slate-500">讀取中...</p>}
            {!loading && error && <p className="py-8 text-center text-sm text-red-600">{error}</p>}

            {!loading && !error && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-[#F9FAFB] text-left text-[#1B3A6B]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">編號</th>
                      <th className="px-4 py-3 font-semibold">地址</th>
                      <th className="px-4 py-3 font-semibold">類型</th>
                      <th className="px-4 py-3 font-semibold">狀態</th>
                      <th className="px-4 py-3 font-semibold">建立日期</th>
                      <th className="px-4 py-3 font-semibold text-right">操作</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((listing) => {
                      const typeInfo = getPropertyType(listing.property_type);
                      const status = statusOptions[listing.status];
                      const isArchived = !!listing.archived_at;

                      return (
                        <tr key={listing.id} className={isArchived ? 'bg-slate-50' : 'bg-white'}>
                          <td className="px-4 py-3 font-medium">#{listing.id}</td>
                          <td className="px-4 py-3">
                            {!isArchived ? (
                              <Link
                                href={resolveListingHref({ id: listing.id, status: listing.status })}
                                className="hover:text-[#1B3A6B] hover:underline"
                              >
                                {getAddressFromListing(listing)}
                              </Link>
                            ) : (
                              <span className="text-slate-500">{getAddressFromListing(listing)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">{typeInfo?.displayName ?? listing.property_type}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">{formatDate(listing.created_at)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                              {!isArchived && (
                                <>
                                  {/* 主操作 */}
                                  <Link
                                    href={resolveListingHref({ id: listing.id, status: listing.status })}
                                    aria-label={resolveListingActionLabel({ id: listing.id, status: listing.status })}
                                    title={resolveListingActionLabel({ id: listing.id, status: listing.status })}
                                    className="rounded-md p-2 text-[#1B3A6B] hover:bg-slate-100 inline-flex items-center"
                                  >
                                    {listing.status === 'documents-ready' ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                      </svg>
                                    )}
                                  </Link>

                                  {/* 次要操作（補件） */}
                                  {(() => {
                                    const secondary = resolveListingSecondaryAction({ id: listing.id, status: listing.status });
                                    if (!secondary) return null;
                                    return (
                                      <Link
                                        href={secondary.href}
                                        aria-label={secondary.label}
                                        title={secondary.label}
                                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 inline-flex items-center"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                        </svg>
                                      </Link>
                                    );
                                  })()}

                                  {/* 移動到資料夾 */}
                                  {folders.length > 0 && (
                                    <select
                                      title="移動到資料夾"
                                      value={listing.folder_id ?? ''}
                                      onChange={e => {
                                        const val = e.target.value;
                                        void handleMoveFolder(listing.id, val === '' ? null : Number(val));
                                      }}
                                      className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-600 hover:border-slate-300"
                                    >
                                      <option value="">未分類</option>
                                      {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                      ))}
                                    </select>
                                  )}

                                  {/* 封存 */}
                                  <button
                                    type="button"
                                    onClick={() => void handleArchive(listing.id)}
                                    title="封存物件"
                                    aria-label="封存物件"
                                    className="rounded-md p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 inline-flex items-center"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                    </svg>
                                  </button>
                                </>
                              )}

                              {isArchived && (
                                /* 還原 */
                                <button
                                  type="button"
                                  onClick={() => void handleRestore(listing.id)}
                                  title="還原物件"
                                  aria-label="還原物件"
                                  className="rounded-md p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 inline-flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                  </svg>
                                </button>
                              )}

                              {/* 刪除 */}
                              <button
                                type="button"
                                onClick={() => void handleDelete(listing.id)}
                                aria-label="刪除物件"
                                title="刪除"
                                className="rounded-md p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 inline-flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          目前沒有符合篩選條件的物件
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
