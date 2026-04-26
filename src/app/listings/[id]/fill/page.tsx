"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import FieldVisitForm, {
  type NavigationState,
  type FieldVisitFormHandle,
} from "@/components/forms/FieldVisitForm";
import Stepper from "@/components/Stepper";
import { PROPERTY_TYPES, type PropertyType } from "@/lib/property-types";
import { useExtractStatus } from "@/hooks/useExtractStatus";

type ListingStatus =
  | "draft"
  | "field-visit-complete"
  | "ready-for-generation"
  | "documents-ready";
type Listing = {
  id: number;
  property_type: PropertyType;
  address: string;
  status: ListingStatus;
  field_visit_data?: string | null;
};
import { getPropertyType } from "@/lib/property-types";

type ListingResponse = {
  listing: Listing;
};

type ListingStatusOption = {
  label: string;
  className: string;
};

const statusOptions: Record<ListingStatus, ListingStatusOption> = {
  draft: {
    label: "草稿",
    className: "bg-slate-100 text-slate-700",
  },
  "field-visit-complete": {
    label: "場勘完成",
    className: "bg-blue-100 text-blue-700",
  },
  "ready-for-generation": {
    label: "可產生文件",
    className: "bg-yellow-100 text-yellow-700",
  },
  "documents-ready": {
    label: "文件已產出",
    className: "bg-emerald-100 text-emerald-700",
  },
};

const parseFieldVisitData = (
  rawData: string | null,
): Record<string, unknown> | null => {
  if (!rawData) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawData) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

const getAddressFromListing = (listing: Listing | null): string => {
  if (!listing) {
    return "-";
  }
  const fieldVisitData = parseFieldVisitData(listing.field_visit_data ?? null);
  const address = fieldVisitData?.address;
  if (typeof address === "string" && address.trim() !== "") {
    return address;
  }
  return "地址尚未填寫";
};

export default function ListingFillPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const listingId = Number(params.id ?? "0");
  const formRef = useRef<FieldVisitFormHandle>(null);

  const [listing, setListing] = useState<Listing | null>(null);
  const [navState, setNavState] = useState<NavigationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [highlightMissing, setHighlightMissing] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const handleFormChange = useCallback(
    (nextFormData: Record<string, unknown>, nextIsComplete: boolean) => {
      setFormData(nextFormData);
      setIsComplete(nextIsComplete);
    },
    [],
  );
  const [submitting, setSubmitting] = useState(false);

  // Task 4.7: 輪詢 OCR 解析狀態（物件載入後才啟動）
  const extractPollEnabled = !loading && !loadError && listingId > 0;
  const { status: extractStatus, progress: extractProgress } =
    useExtractStatus(extractPollEnabled ? listingId : null, extractPollEnabled);

  useEffect(() => {
    if (Number.isNaN(listingId)) {
      setLoadError("物件編號錯誤");
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadListing = async () => {
      try {
        const response = await fetch(`/api/listings/${listingId}`);
        if (!response.ok) {
          throw new Error("讀取物件資料失敗");
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
          caughtError instanceof Error
            ? caughtError.message
            : "讀取物件資料失敗，請稍後再試";
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

  useEffect(() => {
    if (isComplete) {
      setBannerMessage(null);
      setHighlightMissing(false);
    }
  }, [isComplete]);

  // Task 4.7: OCR 解析完成時，重新讀取 listing 以取得最新的 extracted_data + merged_fields
  const prevExtractStatusRef = useRef<string>("none");
  useEffect(() => {
    const prev = prevExtractStatusRef.current;
    prevExtractStatusRef.current = extractStatus;

    if (prev !== "done" && extractStatus === "done" && listingId > 0) {
      // 重新 fetch listing，更新頁面資料
      void (async () => {
        try {
          const res = await fetch(`/api/listings/${listingId}`);
          if (!res.ok) return;
          const payload = (await res.json()) as { listing: Listing };
          setListing(payload.listing);
        } catch {
          // 靜默忽略，不影響主流程
        }
      })();
    }
  }, [extractStatus, listingId]);

  const propertyType = listing?.property_type;

  const propertyTypeLabel = useMemo(() => {
    if (!propertyType) {
      return "-";
    }
    return (
      getPropertyType(propertyType)?.displayName ??
      PROPERTY_TYPES[propertyType].displayName
    );
  }, [propertyType]);

  const submitFieldVisit = async (isComplete: boolean) => {
    if (!listing) {
      return;
    }

    // 防呆：isComplete=true 但實際 navState 顯示未完成時，拒絕送出並高亮缺欄
    if (isComplete && navState && !navState.isComplete) {
      setBannerMessage("尚有必填欄位未完成，請檢查標紅欄位");
      setHighlightMissing(true);
      throw new Error("incomplete");
    }

    setSubmitting(true);
    setSubmitError(null);
    setHighlightMissing(false);

    try {
      const response = await fetch(`/api/listings/${listing.id}/field-visit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: formData,
          isComplete,
        }),
      });

      if (!response.ok) {
        throw new Error("儲存失敗，請稍後再試");
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "儲存失敗，請稍後再試";
      setSubmitError(message);
      throw caughtError;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = useCallback(async () => {
    try {
      await submitFieldVisit(false);
      router.push("/listings");
    } catch (e) {
      console.error("submitFieldVisit failed:", e);
    }
    // submitFieldVisit 是同元件內的普通 async function，每次 render 都重建，
    // 但 useCallback 閉包會抓到當次 render 的最新版本，行為正確。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const actionButtons = useMemo(() => {
    if (!navState) return undefined;
    return (
      <>
        {/* 左側：暫存草稿 */}
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25"
            />
          </svg>
          暫存草稿
        </button>

        {/* 右側：主要行動按鈕 */}
        <div className="flex gap-3">
          {navState.hasNextChapter ? (
            <button
              type="button"
              onClick={() => {
                formRef.current?.goToNextChapter();
              }}
              disabled={!navState.isCurrentChapterComplete || submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#1B3A6B] px-5 py-2 text-sm font-semibold text-white hover:bg-[#15294d] disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {navState.isCurrentChapterComplete
                ? "下一章節"
                : "本章節還有必填未完成"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await submitFieldVisit(true);
                    router.push(
                      `/listings/${listing?.id}/supplementary`,
                    );
                  } catch (e) {
                    console.error("submitFieldVisit failed:", e);
                  }
                }}
                disabled={!navState.isComplete || submitting || !listing}
                className="inline-flex items-center gap-2 rounded-lg border border-[#1B3A6B] px-4 py-2 text-sm font-medium text-[#1B3A6B] hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                  />
                </svg>
                去補充資料
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await submitFieldVisit(true);
                    router.push(
                      `/listings/${listing?.id}/generating`,
                    );
                  } catch (e) {
                    console.error("submitFieldVisit failed:", e);
                  }
                }}
                disabled={!navState.isComplete || submitting || !listing}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                  />
                </svg>
                產出文件
              </button>
            </>
          )}
        </div>
      </>
    );
  }, [navState, submitting, listing, handleSaveDraft, router]);

  const statusBadge = listing ? statusOptions[listing.status] : null;
  const initialData =
    parseFieldVisitData(listing?.field_visit_data ?? null) ?? undefined;

  return (
    <div className="min-h-screen bg-[#F5F6FA] font-['Manrope'] text-[#2D3142]">
      <div className="mx-auto flex w-full max-w-[1440px]">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-4">
            <Stepper
              currentStep={2}
              listingId={listing?.id ?? null}
              listingStatus={
                (listing?.status as
                  | "draft"
                  | "field-visit-complete"
                  | "ready-for-generation"
                  | "documents-ready"
                  | undefined) ?? null
              }
            />
          </div>

          <section className="rounded-lg bg-white p-6 shadow-[0_8px_24px_rgba(45,49,66,0.08)]">
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h1 className="text-2xl font-bold text-[#1B3A6B]">資料填寫</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-700">
                <span className="rounded-full bg-white px-3 py-1">
                  物件編號：#{listing?.id ?? "-"}
                </span>
                <span className="rounded-full bg-white px-3 py-1">
                  物件地址：{getAddressFromListing(listing)}
                </span>
                <span className="rounded-full bg-white px-3 py-1">
                  類型：{propertyTypeLabel}
                </span>
                {statusBadge && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge.className}`}
                  >
                    狀態：{statusBadge.label}
                  </span>
                )}
              </div>
            </div>

            {bannerMessage && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {bannerMessage}
              </div>
            )}

            {loading && (
              <p className="py-8 text-center text-sm text-slate-500">
                讀取中...
              </p>
            )}

            {!loading && loadError && (
              <p className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">
                {loadError}
              </p>
            )}

            {!loading && !loadError && propertyType && (
              <>
                <FieldVisitForm
                  key={listing?.id ?? "pending"}
                  propertyType={propertyType}
                  onSave={handleFormChange}
                  initialData={initialData}
                  highlightMissing={highlightMissing}
                  listingId={listing?.id}
                  ref={formRef}
                  onNavigationStateChange={setNavState}
                  actionButtons={actionButtons}
                  extractProgress={
                    extractStatus !== "none"
                      ? { status: extractStatus, progress: extractProgress }
                      : undefined
                  }
                />

                {submitError && (
                  <div className="text-sm text-red-600 mt-6 px-4 py-3 bg-red-50 rounded-md">
                    {submitError}
                  </div>
                )}
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
