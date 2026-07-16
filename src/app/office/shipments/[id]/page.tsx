"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";

interface InventoryItem {
  id: string;
  janCode: string;
  name: string;
  manufacturer: string;
  specification: string;
}

interface ShipmentOrderItem {
  id: string;
  quantity: number;
  note: string | null;
  item: InventoryItem;
}

interface ShipmentOrder {
  id: string;
  orderNumber: string;
  shipDate: string;
  status: "DRAFT" | "CONFIRMED" | "SHIPPED";
  note: string | null;
  items: ShipmentOrderItem[];
}

const STATUS_LABEL: Record<ShipmentOrder["status"], string> = {
  DRAFT: "下書き",
  CONFIRMED: "確定",
  SHIPPED: "出荷済み",
};

const STATUS_STYLE: Record<ShipmentOrder["status"], string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-green-100 text-green-700",
};

const NEXT_STATUS: Record<ShipmentOrder["status"], ShipmentOrder["status"] | null> = {
  DRAFT: "CONFIRMED",
  CONFIRMED: "SHIPPED",
  SHIPPED: null,
};

export default function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);

  const [order, setOrder] = useState<ShipmentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  async function loadOrder() {
    setLoading(true);
    try {
      const res = await fetch(`/api/shipment-orders/${id}`);
      if (!res.ok) throw new Error("出荷指示書の取得に失敗しました。");
      setOrder(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusChange(nextStatus: ShipmentOrder["status"]) {
    setUpdating(true);
    setError("");
    try {
      const res = await fetch(`/api/shipment-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "更新に失敗しました。");
      }
      await loadOrder();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました。");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <p className="text-gray-400">読み込み中...</p>;
  }

  if (!order) {
    return <p className="text-red-600">{error || "見つかりません。"}</p>;
  }

  const next = NEXT_STATUS[order.status];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
        <a
          href={`/office/shipments/${order.id}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 no-underline"
        >
          印刷
        </a>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid max-w-xl grid-cols-2 gap-x-8 gap-y-3 rounded-lg bg-white p-6 text-sm shadow-sm">
        <div className="text-gray-500">出荷予定日</div>
        <div>{new Date(order.shipDate).toLocaleDateString("ja-JP")}</div>
        <div className="text-gray-500">ステータス</div>
        <div>
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[order.status]}`}
          >
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <div className="text-gray-500">備考</div>
        <div>{order.note ?? "-"}</div>
      </div>

      {next && (
        <button
          onClick={() => handleStatusChange(next)}
          disabled={updating}
          className="mb-6 rounded-md bg-[#667eea] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {updating ? "更新中..." : `${STATUS_LABEL[next]}にする`}
        </button>
      )}

      <h2 className="mb-3 text-lg font-bold">アイテム一覧</h2>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">商品名</th>
              <th className="px-4 py-3">JANコード</th>
              <th className="px-4 py-3">数量</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((oi) => (
              <tr key={oi.id} className="border-b border-gray-100">
                <td className="px-4 py-3">
                  <Link
                    href={`/office/inventory/${oi.item.id}`}
                    className="text-[#667eea] no-underline hover:underline"
                  >
                    {oi.item.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{oi.item.janCode}</td>
                <td className="px-4 py-3">{oi.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
