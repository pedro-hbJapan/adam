"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ShipmentOrderItem {
  id: string;
  itemId: string;
  quantity: number;
  note: string | null;
}

interface ShipmentOrder {
  id: string;
  orderNumber: string;
  shipDate: string;
  status: "DRAFT" | "CONFIRMED" | "SHIPPED";
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

export default function ShipmentsPage() {
  const [orders, setOrders] = useState<ShipmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/shipment-orders");
        if (!res.ok) throw new Error("出荷指示書の取得に失敗しました。");
        setOrders(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : "エラーが発生しました。");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">出荷指示書</h1>
        <Link
          href="/office/shipments/new"
          className="rounded-md bg-[#667eea] px-4 py-2 text-sm font-semibold text-white no-underline"
        >
          + 新規作成
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">注文番号</th>
              <th className="px-4 py-3">出荷予定日</th>
              <th className="px-4 py-3">ステータス</th>
              <th className="px-4 py-3">アイテム数</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  読み込み中...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  出荷指示書がありません。
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/office/shipments/${order.id}`}
                      className="font-semibold text-[#667eea] no-underline hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(order.shipDate).toLocaleDateString("ja-JP")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[order.status]}`}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{order.items.length}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
