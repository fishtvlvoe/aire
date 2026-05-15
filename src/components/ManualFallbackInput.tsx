"use client";

import * as React from "react";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

/**
 * 依 apiId 決定預設欄位清單
 * 每個欄位帶 key（回傳給父層的欄位名稱）和 label（顯示給使用者的中文欄位名稱）
 */
function getDefaultFields(apiId: string): Array<{ key: string; label: string }> {
  const fieldMap: Record<string, Array<{ key: string; label: string }>> = {
    // 建物謄本
    building_transcript: [
      { key: "building_number", label: "建號" },
      { key: "area", label: "面積（平方公尺）" },
      { key: "floors", label: "樓層數" },
      { key: "owner_name", label: "所有權人姓名" },
    ],
    // 土地謄本
    land_transcript: [
      { key: "lot_number", label: "地號" },
      { key: "land_area", label: "地目面積（平方公尺）" },
      { key: "owner_name", label: "所有權人姓名" },
      { key: "rights_ratio", label: "持分比例" },
    ],
    // 地籍圖
    cadastral_map: [
      { key: "map_number", label: "圖幅編號" },
      { key: "coordinate", label: "座標（WGS84）" },
    ],
    // 建物測量成果圖
    building_survey: [
      { key: "survey_date", label: "測量日期" },
      { key: "surveyor", label: "測量機關" },
      { key: "area_sqm", label: "測量面積（平方公尺）" },
    ],
  };

  return (
    fieldMap[apiId] ?? [
      { key: "value", label: "資料內容" },
      { key: "note", label: "備註" },
    ]
  );
}

/**
 * ManualFallbackInput — API 查詢失敗時的手動資料填入表單
 * 根據 apiId 動態顯示對應欄位，送出時帶 source: "manual" 標記。
 */
interface ManualFallbackInputProps {
  /** 失敗的 API 識別碼 */
  apiId: string;
  /** 提交回調，回傳已填入的欄位資料 */
  onSubmit: (data: Record<string, string>) => void;
}

export function ManualFallbackInput({ apiId, onSubmit }: ManualFallbackInputProps) {
  const fields = getDefaultFields(apiId);

  const [values, setValues] = React.useState<Record<string, string>>(
    () => Object.fromEntries(fields.map((f) => [f.key, ""]))
  );

  // apiId 改變時重置表單
  React.useEffect(() => {
    const newFields = getDefaultFields(apiId);
    setValues(Object.fromEntries(newFields.map((f) => [f.key, ""])));
  }, [apiId]);

  function handleChange(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // 帶入 source: "manual" 標記
    onSubmit({ ...values, source: "manual" });
  }

  const hasAnyValue = Object.values(values).some((v) => v.trim() !== "");

  return (
    <Card className="p-4 border-dashed border-amber-300 bg-amber-50/40">
      <div className="flex items-center gap-2 mb-3">
        <PenLine className="h-4 w-4 text-amber-600" />
        <p className="text-sm font-medium text-amber-800">
          API 查詢失敗，請手動填入資料
        </p>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        此資料將標記為「手動填入」（source: manual），請確保資料正確。
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={`manual-${apiId}-${field.key}`} className="text-xs">
              {field.label}
            </Label>
            <Input
              id={`manual-${apiId}-${field.key}`}
              value={values[field.key] ?? ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              placeholder={`輸入${field.label}`}
              className="h-8 text-sm"
            />
          </div>
        ))}

        <div className="pt-1">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={!hasAnyValue}
            className="border-amber-400 text-amber-800 hover:bg-amber-100"
          >
            儲存手動資料
          </Button>
        </div>
      </form>
    </Card>
  );
}
