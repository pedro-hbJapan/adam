"use client";

import { useEffect, useState, use as usePromise } from "react";

interface InventoryItem {
  id: string;
  janCode: string;
  name: string;
  manufacturer: string;
  supplier: string | null;
  specification: string;
  unitsPerCase: number;
  expirationDate: string | null;
}

interface Movement {
  id: string;
  type: "IN" | "OUT";
  date: string;
  quantity: number;
  note: string | null;
}

const emptyMovementForm = {
  date: new Date().toISOString().slice(0, 10),
  quantity: "",
  note: "",
};

export default function InventoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formType, setFormType] = useState<"IN" | "OUT" | null>(null);
  const [form, setForm] = useState(emptyMovementForm);
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [itemsRes, movementsRes] = await Promise.all([
        fetch("/api/inventory"),
        fetch(`/api/inventory/${id}/movements`),
      ]);
      if (!itemsRes.ok || !movementsRes.ok) {
        throw new Error("データの取得に失敗しました。");
      }
      const items: InventoryItem[] = await itemsRes.json();
      const found = items.find((it) => it.id === id) ?? null;
      setItem(found);
      const movs: Movement[] = await movementsRes.json();
      setMovements(movs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const stock = movements.reduce(
    (sum, m) => sum + (m.type === "IN" ? m.quantity : -m.quantity),
    0
  );

  async function handleSubmitMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!formType) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/stock-movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: id,
          type: formType,
          date: form.date,
          quantity: Number(form.quantity),
          note: form.note || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "登録に失敗しました。");
      }
      setForm(emptyMovementForm);
      setFormType(null);
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-gray-400">読み込み中...</p>;
  }

  if (!item) {
    return <p className="text-red-600">アイテムが見つかりません。</p>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{item.name}</h1>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-3 rounded-lg bg-white p-6 text-sm shadow-sm">
        <InfoRow label="JANコード" value={item.janCode} />
        <InfoRow label="メーカー" value={item.manufacturer} />
        <InfoRow label="仕入先" value={item.supplier ?? "-"} />
        <InfoRow label="規格" value={item.specification} />
        <InfoRow label="1ケース入数" value={String(item.unitsPerCase)} />
        <InfoRow
          label="賞味期限"
          value={
            item.expirationDate
              ? new Date(item.expirationDate).toLocaleDateString("ja-JP")
              : "-"
          }
        />
        <InfoRow label="現在庫数" value={`${stock} ケース`} strong />
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFormType(formType === "IN" ? null : "IN")}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {formType === "IN" ? "キャンセル" : "+ 入荷記録"}
        </button>
        <button
          onClick={() => setFormType(formType === "OUT" ? null : "OUT")}
          className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
        >
          {formType === "OUT" ? "キャンセル" : "+ 出荷記録"}
        </button>
      </div>

      {formType && (
        <form
          onSubmit={handleSubmitMovement}
          className="mb-6 flex max-w-md flex-col gap-3 rounded-lg bg-white p-6 shadow-sm"
        >
          <h3 className="mb-1 text-base font-bold">
            {formType === "IN" ? "入荷記録" : "出荷記録"}
          </h3>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">日付</span>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">数量(ケース)</span>
            <input
              type="number"
              required
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">備考(任意)</span>
            <input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-md bg-[#667eea] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "登録中..." : "登録"}
          </button>
        </form>
      )}

      <h2 className="mb-3 text-lg font-bold">入出荷履歴</h2>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">日付</th>
              <th className="px-4 py-3">種別</th>
              <th className="px-4 py-3">数量</th>
              <th className="px-4 py-3">備考</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  履歴がありません。
                </td>
              </tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">
                    {new Date(m.date).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        m.type === "IN"
                          ? "rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
                          : "rounded bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700"
                      }
                    >
                      {m.type === "IN" ? "入荷" : "出荷"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{m.quantity}</td>
                  <td className="px-4 py-3">{m.note ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <>
      <div className="text-gray-500">{label}</div>
      <div className={strong ? "font-bold" : ""}>{value}</div>
    </>
  );
}
