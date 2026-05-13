"use client";

// AIRE 新增案件頁（Task 5.3）
//
// - property_type 選擇器（成屋/土地 radio）
// - 必填欄位：地號、地址、屋主姓名
// - zod 驗證
// - 提交成功後 router.push('/cases/<new-id>')

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { casesApi } from "@/lib/cases-api";

const schema = z.object({
  property_type: z.enum(["residential", "land"]),
  land_lot_no: z.string().min(1, "地號為必填"),
  address: z.string().min(1, "地址為必填"),
  owner_name: z.string().min(1, "屋主姓名為必填"),
  case_no: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewCasePage() {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>({
    property_type: "residential",
    land_lot_no: "",
    address: "",
    owner_name: "",
    case_no: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof FormValues>(k: K, v: FormValues[K]) {
    setValues((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormValues, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormValues;
        fieldErrors[k] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const created = await casesApi.create({
        property_type: parsed.data.property_type,
        land_lot_no: parsed.data.land_lot_no,
        address: parsed.data.address,
        owner_name: parsed.data.owner_name,
        case_no: parsed.data.case_no || null,
      });
      router.push(`/cases/${created.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 14,
    marginBottom: 4,
  };

  return (
    <main
      style={{
        maxWidth: 640,
        margin: "32px auto",
        padding: 24,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: 24 }}>新增案件</h1>
      <form onSubmit={handleSubmit}>
        <section style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            物件類型
          </label>
          <label style={{ marginRight: 24 }}>
            <input
              type="radio"
              name="property_type"
              value="residential"
              checked={values.property_type === "residential"}
              onChange={() => update("property_type", "residential")}
            />{" "}
            成屋
          </label>
          <label>
            <input
              type="radio"
              name="property_type"
              value="land"
              checked={values.property_type === "land"}
              onChange={() => update("property_type", "land")}
            />{" "}
            土地
          </label>
        </section>

        <section style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            地號 *
          </label>
          <input
            type="text"
            value={values.land_lot_no}
            onChange={(e) => update("land_lot_no", e.target.value)}
            style={inputStyle}
            placeholder="例：台北市信義區XX段 123-4"
          />
          {errors.land_lot_no ? (
            <span style={{ color: "#b00020", fontSize: 12 }}>{errors.land_lot_no}</span>
          ) : null}
        </section>

        <section style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            地址 *
          </label>
          <input
            type="text"
            value={values.address}
            onChange={(e) => update("address", e.target.value)}
            style={inputStyle}
            placeholder="例：台北市信義區XX路 1 號"
          />
          {errors.address ? (
            <span style={{ color: "#b00020", fontSize: 12 }}>{errors.address}</span>
          ) : null}
        </section>

        <section style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            屋主姓名 *
          </label>
          <input
            type="text"
            value={values.owner_name}
            onChange={(e) => update("owner_name", e.target.value)}
            style={inputStyle}
          />
          {errors.owner_name ? (
            <span style={{ color: "#b00020", fontSize: 12 }}>{errors.owner_name}</span>
          ) : null}
        </section>

        <section style={{ marginBottom: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            案件編號（選填）
          </label>
          <input
            type="text"
            value={values.case_no ?? ""}
            onChange={(e) => update("case_no", e.target.value)}
            style={inputStyle}
          />
        </section>

        {submitError ? (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: 12,
              background: "#fdecea",
              color: "#b00020",
              borderRadius: 6,
            }}
          >
            建立失敗：{submitError}
          </div>
        ) : null}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            type="button"
            onClick={() => router.push("/cases")}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: "white",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: loading ? "#999" : "#111",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "建立中…" : "建立案件"}
          </button>
        </div>
      </form>
    </main>
  );
}
