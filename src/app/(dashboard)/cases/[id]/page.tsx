"use client";

// AIRE 編輯案件頁（Task 5.4 — shadcn/ui 升級 + Task 8.4 — 地政 API 整合）
//
// - 載入 case 顯示 header + 對應表單
// - Tabs 切換成屋 / 土地
// - 「刪除」按鈕 + 確認 modal
// - 「標示為完成」按鈕僅在 status='draft' 顯示
// - 儲存成功用 sonner toast，必填欄位空值顯示紅色提示
// - BalanceBanner 低餘額警告
// - Parcel data pull status 顯示
//
// Note: Next.js static export 下動態路由 [id] 用 client-side router 取參數。

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FileSearch,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Minus,
} from "lucide-react";
import {
  casesApi,
  formatTpeDate,
  propertyTypeLabel,
  statusLabel,
  type CaseRow,
} from "@/lib/cases-api";
import { getBalance, type BalanceInfo } from "@/lib/land-registry-api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { BalanceBanner } from "@/components/BalanceBanner";
import { PullParcelDataButton } from "@/components/PullParcelDataButton";
import { RealPricePanel } from "@/components/RealPricePanel";
import { parseAddressForQuery } from "@/lib/address-parser";

// 必填欄位驗證錯誤
interface FormErrors {
  owner_name?: string;
  property_type?: string;
}

/** 地政資料查詢狀態 */
type PullStatus = "not_queried" | "querying" | "completed" | "partial_manual";

const PULL_STATUS_CONFIG: Record<
  PullStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  not_queried: {
    label: "未查詢",
    icon: <Minus className="h-3.5 w-3.5" />,
    className: "bg-muted text-muted-foreground border-border",
  },
  querying: {
    label: "查詢中",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  completed: {
    label: "已完成",
    icon: <CheckCircle className="h-3.5 w-3.5" />,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  partial_manual: {
    label: "部分手動",
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
};

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [c, setCase] = useState<CaseRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // 地政 API 餘額
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null);

  // 地政資料查詢狀態（TODO: 從案件資料或 IPC 取得實際狀態）
  const [pullStatus] = useState<PullStatus>("not_queried");

  // 編輯 buffer
  const [buf, setBuf] = useState<{
    case_no: string;
    land_lot_no: string;
    address: string;
    owner_name: string;
    notes: string;
    property_type: "residential" | "land";
  }>({
    case_no: "",
    land_lot_no: "",
    address: "",
    owner_name: "",
    notes: "",
    property_type: "residential",
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await casesApi.get(id);
        if (cancelled) return;
        setCase(row);
        setBuf({
          case_no: row.case_no ?? "",
          land_lot_no: row.land_lot_no,
          address: row.address,
          owner_name: row.owner_name ?? "",
          notes: "",
          property_type: row.property_type,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // 載入餘額資訊
  useEffect(() => {
    let cancelled = false;
    getBalance()
      .then((info) => {
        if (!cancelled) setBalanceInfo(info);
      })
      .catch(() => {
        // 靜默失敗，不影響案件頁主功能
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function validate(): boolean {
    const errors: FormErrors = {};
    if (!buf.owner_name.trim()) errors.owner_name = "物件名稱為必填";
    if (!buf.property_type) errors.property_type = "案件類型為必填";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!c) return;
    if (!validate()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await casesApi.update(c.id, {
        property_type: buf.property_type,
        land_lot_no: buf.land_lot_no,
        address: buf.address,
        owner_name: buf.owner_name || null,
        case_no: buf.case_no || null,
      });
      setCase(updated);
      toast.success("案件已儲存");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!c) return;
    setSaving(true);
    try {
      await casesApi.delete(c.id);
      router.push("/cases");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSaving(false);
    }
  }

  function handleExportCase() {
    if (!c) return;
    router.push(`/cases/${c.id}/preview`);
  }

  async function handleMarkCompleted() {
    if (!c) return;
    setSaving(true);
    try {
      const updated = await casesApi.markCompleted(c.id);
      setCase(updated);
      toast.success("案件已標示為完成");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (error && !c) {
    return (
      <main className="p-6">
        <p className="text-destructive">載入失敗：{error}</p>
      </main>
    );
  }

  if (!c) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground">載入中…</p>
      </main>
    );
  }

  const statusCfg = PULL_STATUS_CONFIG[pullStatus];

  return (
    <main className="max-w-2xl mx-auto py-8 px-6 space-y-6">
      {/* 低餘額警告 Banner */}
      <BalanceBanner lowBalanceWarning={balanceInfo?.low_balance_warning ?? false} />

      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/cases")}>
            ← 返回
          </Button>
          <h1 className="text-xl font-semibold">
            {c.case_no ?? c.id.slice(0, 8)}（{propertyTypeLabel(c.property_type)}）
          </h1>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              c.status === "draft"
                ? "bg-muted text-muted-foreground"
                : "bg-green-100 text-green-800"
            }`}
          >
            {statusLabel(c.status)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          建立於 {formatTpeDate(c.created_at)} ・ 最後更新 {formatTpeDate(c.updated_at)}
        </p>
      </header>

      {/* 地政資料查詢狀態 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              地政資料查詢
            </CardTitle>
            <Badge
              variant="outline"
              className={`gap-1.5 ${statusCfg.className}`}
            >
              {statusCfg.icon}
              {statusCfg.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {pullStatus === "not_queried" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                尚未查詢地政資料，可直接在此使用「拉謄本」先取得資料。
              </p>
              <PullParcelDataButton
                caseId={c.id}
                parcelId={buf.land_lot_no || "0001-0000"}
                apiIds={["A1", "A2", "A3"]}
              />
            </div>
          )}
          {pullStatus === "completed" && (
            <p className="text-sm text-green-700">
              所有地政資料已查詢完成
            </p>
          )}
          {pullStatus === "partial_manual" && (
            <p className="text-sm text-yellow-700">
              部分欄位為手動填入，請確認資料正確性
            </p>
          )}
        </CardContent>
      </Card>

      {/* 實價登錄參考 */}
      {(() => {
        const { district, keyword } = parseAddressForQuery(buf.address);
        return <RealPricePanel district={district} keyword={keyword} />;
      })()}

      {/* 案件類型 Select（必填） */}
      <div className="space-y-1.5">
        <Label htmlFor="property_type">
          案件類型 <span className="text-destructive">*</span>
        </Label>
        <Select
          value={buf.property_type}
          onValueChange={(v) => {
            setBuf({ ...buf, property_type: v as "residential" | "land" });
            if (formErrors.property_type) setFormErrors({ ...formErrors, property_type: undefined });
          }}
        >
          <SelectTrigger
            id="property_type"
            className={formErrors.property_type ? "border-destructive" : ""}
          >
            <SelectValue placeholder="選擇案件類型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="residential">成屋</SelectItem>
            <SelectItem value="land">土地</SelectItem>
          </SelectContent>
        </Select>
        {formErrors.property_type && (
          <p className="text-xs text-destructive">{formErrors.property_type}</p>
        )}
      </div>

      {/* Tabs：成屋 / 土地 */}
      <Tabs defaultValue={c.property_type === "land" ? "land" : "residential"}>
        <TabsList>
          <TabsTrigger value="residential">成屋資訊</TabsTrigger>
          <TabsTrigger value="land">土地資訊</TabsTrigger>
        </TabsList>

        {/* 成屋 Tab */}
        <TabsContent value="residential">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">成屋基本資料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="owner_name">
                  物件名稱 / 屋主 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="owner_name"
                  value={buf.owner_name}
                  onChange={(e) => {
                    setBuf({ ...buf, owner_name: e.target.value });
                    if (formErrors.owner_name) setFormErrors({ ...formErrors, owner_name: undefined });
                  }}
                  className={formErrors.owner_name ? "border-destructive" : ""}
                  placeholder="輸入屋主姓名或物件名稱"
                />
                {formErrors.owner_name && (
                  <p className="text-xs text-destructive">{formErrors.owner_name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">地址</Label>
                <Input
                  id="address"
                  value={buf.address}
                  onChange={(e) => setBuf({ ...buf, address: e.target.value })}
                  placeholder="輸入物件地址"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="case_no">案件編號</Label>
                <Input
                  id="case_no"
                  value={buf.case_no}
                  onChange={(e) => setBuf({ ...buf, case_no: e.target.value })}
                  placeholder="輸入案件編號（選填）"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes_residential">備註</Label>
                <Textarea
                  id="notes_residential"
                  value={buf.notes}
                  onChange={(e) => setBuf({ ...buf, notes: e.target.value })}
                  placeholder="其他備注事項"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 土地 Tab */}
        <TabsContent value="land">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">土地基本資料</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="land_lot_no">地號</Label>
                <Input
                  id="land_lot_no"
                  value={buf.land_lot_no}
                  onChange={(e) => setBuf({ ...buf, land_lot_no: e.target.value })}
                  placeholder="輸入地號"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="owner_name_land">
                  物件名稱 / 地主 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="owner_name_land"
                  value={buf.owner_name}
                  onChange={(e) => {
                    setBuf({ ...buf, owner_name: e.target.value });
                    if (formErrors.owner_name) setFormErrors({ ...formErrors, owner_name: undefined });
                  }}
                  className={formErrors.owner_name ? "border-destructive" : ""}
                  placeholder="輸入地主姓名或物件名稱"
                />
                {formErrors.owner_name && (
                  <p className="text-xs text-destructive">{formErrors.owner_name}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address_land">地址</Label>
                <Input
                  id="address_land"
                  value={buf.address}
                  onChange={(e) => setBuf({ ...buf, address: e.target.value })}
                  placeholder="輸入土地地址"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="case_no_land">案件編號</Label>
                <Input
                  id="case_no_land"
                  value={buf.case_no}
                  onChange={(e) => setBuf({ ...buf, case_no: e.target.value })}
                  placeholder="輸入案件編號（選填）"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes_land">備註</Label>
                <Textarea
                  id="notes_land"
                  value={buf.notes}
                  onChange={(e) => setBuf({ ...buf, notes: e.target.value })}
                  placeholder="其他備注事項"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 全局錯誤 */}
      {error && (
        <div
          role="alert"
          className="px-4 py-3 bg-red-50 text-destructive rounded-md text-sm border border-destructive/20"
        >
          {error}
        </div>
      )}

      {/* 操作按鈕列 */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "儲存中…" : "儲存變更"}
        </Button>

        {c.status === "draft" && (
          <Button variant="outline" onClick={handleMarkCompleted} disabled={saving}
            className="text-green-700 border-green-700 hover:bg-green-50">
            標示為完成
          </Button>
        )}

        <Button variant="secondary" onClick={handleExportCase} disabled={saving}>
          匯出此案件
        </Button>

        <div className="flex-1" />

        <Button
          variant="outline"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={saving}
          className="text-destructive border-destructive hover:bg-red-50"
        >
          刪除
        </Button>
      </div>

      {/* 刪除確認 Modal */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div className="bg-background rounded-lg p-6 max-w-sm w-[90%] space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold">確認刪除案件？</h2>
            <p className="text-sm text-muted-foreground">
              此操作不可復原，將永久刪除案件「{c.case_no ?? c.id.slice(0, 8)}」
              以及其表單草稿。
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                取消
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                {saving ? "刪除中…" : "確認刪除"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
