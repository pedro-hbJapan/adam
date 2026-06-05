"use client";

import { useEffect, useState, useCallback } from "react";

type OrderStatus = "PENDING" | "FEASIBLE" | "PRODUCED" | "PICKED";

interface OrderItem {
  id: string;
  boxes: number;
  unitsPerBox: number;
  product: { id: string; name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  shippingDate: string;
  customer: { id: string; name: string };
  items: OrderItem[];
}

const TABS: { status: OrderStatus; label: string }[] = [
  { status: "PENDING", label: "未確認" },
  { status: "FEASIBLE", label: "作成可能" },
  { status: "PRODUCED", label: "作成済" },
  { status: "PICKED", label: "ピッキング済" },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "#6b7280",
  FEASIBLE: "#2563eb",
  PRODUCED: "#ea580c",
  PICKED: "#16a34a",
};

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  PENDING: { next: "FEASIBLE", label: "作成可能にする" },
  FEASIBLE: { next: "PRODUCED", label: "作成済にする" },
  PRODUCED: { next: "PICKED", label: "ピッキング済にする" },
};

function getUrgencyClass(shippingDate: string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ship = new Date(shippingDate);
  const shipDay = new Date(ship.getFullYear(), ship.getMonth(), ship.getDate());
  const diff = (shipDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff <= 0) return "border-l-4 border-l-red-500 bg-red-50";
  if (diff <= 1) return "border-l-4 border-l-orange-400 bg-orange-50";
  return "border-l-4 border-l-transparent bg-white";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}(${["日","月","火","水","木","金","土"][d.getDay()]})`;
}

export default function WarehouseOrdersPage() {
  const [activeTab, setActiveTab] = useState<OrderStatus>("PENDING");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState<string | null>(null);

  const fetchOrders = useCallback(async (status: OrderStatus) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?status=${status}`);
      if (res.ok) {
        const data: Order[] = await res.json();
        data.sort(
          (a, b) => new Date(a.shippingDate).getTime() - new Date(b.shippingDate).getTime()
        );
        setOrders(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(activeTab);
  }, [activeTab, fetchOrders]);

  const handleTransition = async (orderId: string, nextStatus: OrderStatus) => {
    setTransitioning(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } finally {
      setTransitioning(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold lg:text-2xl">注文管理</h1>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            onClick={() => setActiveTab(tab.status)}
            className={`flex-1 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.status
                ? "bg-white shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
            style={
              activeTab === tab.status
                ? { borderBottom: `2px solid ${STATUS_COLORS[tab.status]}` }
                : undefined
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Order cards */}
      {loading ? (
        <div className="py-12 text-center text-gray-400">読み込み中...</div>
      ) : orders.length === 0 ? (
        <div className="py-12 text-center text-gray-400">該当する注文はありません</div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const action = NEXT_STATUS[order.status];
            return (
              <div
                key={order.id}
                className={`rounded-xl p-4 shadow-sm ${getUrgencyClass(order.shippingDate)}`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="text-base font-semibold">{order.orderNumber}</div>
                    <div className="text-sm text-gray-600">{order.customer.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatDate(order.shippingDate)}</div>
                    <span
                      className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: STATUS_COLORS[order.status] }}
                    >
                      {TABS.find((t) => t.status === order.status)?.label}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-3 text-sm text-gray-700">
                  {order.items.map((item) => (
                    <div key={item.id}>
                      {item.product.name} × {item.boxes}箱
                    </div>
                  ))}
                </div>

                {/* Action button */}
                {action && (
                  <button
                    onClick={() => handleTransition(order.id, action.next)}
                    disabled={transitioning === order.id}
                    className="w-full rounded-lg py-3 text-base font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{
                      backgroundColor: STATUS_COLORS[action.next],
                      minHeight: 48,
                    }}
                  >
                    {transitioning === order.id ? "処理中..." : action.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
