"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface InventoryItem {
  id: string;
  janCode: string;
  name: string;
  manufacturer: string;
  specification: string;
  stock: number;
}

interface LineItem {
  itemId: string;
  quantity: string;
}

export default function NewShipmentPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [shipDate, setShipDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState<Record<string, LineItem>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/inventory");
        if (!res.ok) throw new Error("在庫の取得に失敗しました。");
        setItems(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました。");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = { itemId: id, quantity: "1" };
      }
      return next;
    });
  }

  function setQuantity(id: string, quantity: string) {
    setSelected((prev) => ({ ...prev, [id]: { ...prev[id], quantity } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const lineItems = Object.values(selected);
    if (lineItems.length === 0) {
      setError("出荷対象のアイテムを1つ以上選択してください。");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/shipment-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipDate,
          note: note || undefined,
          items: lineItems.map((li) => ({
            itemId: li.itemId,
            quantity: Number(li.quantity),
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "作成に失敗しました。");
      }
      const created = await res.json();
      router.push(`/office/shipments/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">出荷指示書作成</h1>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6 flex max-w-lg flex-col gap-3 rounded-lg bg-white p-6 shadow-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">出荷予定日</span>
            <input
              type="date"
              required
              value={shipDate}
              onChange={(e) => setShipDate(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-600">備考(任意)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <h2 className="mb-3 text-lg font-bold">出荷対象アイテム</h2>
        <div className="mb-6 overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">選択</th>
                <th className="px-4 py-3">商品名</th>
                <th className="px-4 py-3">JANコード</th>
                <th className="px-4 py-3">現在庫数</th>
                <th className="px-4 py-3">出荷数量</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    読み込み中...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    在庫アイテムがありません。
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isSelected = !!selected[item.id];
                  return (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item.id)}
                        />
                      </td>
                      <td className="px-4 py-3">{item.name}</td>
                      <td className="px-4 py-3">{item.janCode}</td>
                      <td className="px-4 py-3">{item.stock}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          disabled={!isSelected}
                          value={selected[item.id]?.quantity ?? ""}
                          onChange={(e) => setQuantity(item.id, e.target.value)}
                          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm disabled:bg-gray-100"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-[#667eea] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? "作成中..." : "出荷指示書を作成"}
        </button>
      </form>
    </div>
  );
}
