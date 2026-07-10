"use client";

import { useEffect, useState, useCallback } from "react";

const STATUS_ORDER = ["PENDING", "FEASIBLE", "PRODUCED", "PICKED"] as const;
type OrderStatus = (typeof STATUS_ORDER)[number];

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

const NEXT_STATUS: Partial<Record<OrderStatus, { next: OrderStatus; label: string }>> = {
  PENDING: { next: "FEASIBLE", label: "作成可能にする" },
  FEASIBLE: { next: "PRODUCED", label: "作成済にする" },
  PRODUCED: { next: "PICKED", label: "ピッキング済にする" },
};

function getUrgencyLevel(shippingDate: string): "urgent" | "soon" | "normal" {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const ship = new Date(shippingDate);
  const shipDay = new Date(ship.getFullYear(), ship.getMonth(), ship.getDate());
  const diff = (shipDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diff <= 0) return "urgent";
  if (diff <= 1) return "soon";
  return "normal";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}(${["日","月","火","水","木","金","土"][d.getDay()]})`;
}

function ClipboardIcon({ urgent }: { urgent?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
    >
      <rect x="8" y="4" width="10" height="14" rx="2" />
      <path d="M4 8h.01" />
      <path d="M6 6v12a2 2 0 0 0 2 2h10" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 9h18" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-3.5 w-3.5"
    >
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function AlertDot() {
  return (
    <span className="relative ml-2 inline-flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-500" />
    </span>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
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
      <h1 className="mb-5 text-xl font-bold tracking-tight neu-text-strong lg:text-2xl">
        注文管理
      </h1>

      {/* Segmented tabs */}
      <div className="neu-inset-sm mb-5 flex overflow-x-auto rounded-2xl p-1.5">
        {TABS.map((tab) => {
          const active = activeTab === tab.status;
          return (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              className={`flex-1 whitespace-nowrap rounded-xl px-2 py-2.5 text-xs font-semibold transition-all sm:text-sm ${
                active ? "neu-tab-active" : "neu-tab"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Order cards */}
      {loading ? (
        <div className="py-16 text-center neu-text">読み込み中...</div>
      ) : orders.length === 0 ? (
        <div className="neu-surface rounded-2xl py-16 text-center neu-text">
          該当する注文はありません
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-24 lg:pb-4">
          {orders.map((order) => {
            const action = NEXT_STATUS[order.status];
            const urgency = getUrgencyLevel(order.shippingDate);
            const isUrgent = urgency === "urgent" || urgency === "soon";

            return (
              <div
                key={order.id}
                className={`neu-surface rounded-3xl p-4 sm:p-5 ${
                  isUrgent ? "neu-urgent-glow" : ""
                }`}
              >
                {/* Header */}
                <div className="mb-4 flex items-start gap-3">
                  <div className="neu-icon-box flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-[#5f6b7a]">
                    <ClipboardIcon urgent={isUrgent} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-lg font-bold leading-tight neu-text-strong">
                        {order.orderNumber}
                      </div>
                      <button
                        className="neu-icon-box -mt-1 flex h-7 w-7 items-center justify-center rounded-full text-[#7b8794]"
                        aria-label="詳細"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-1 w-1"
                        >
                          <circle cx="12" cy="6" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="18" r="2" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-sm neu-text">
                      <MapPinIcon />
                      <span className="truncate">{order.customer.name}</span>
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="mb-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex items-start gap-2.5">
                    <div className="neu-icon-box flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#5f6b7a]">
                      <CalendarIcon />
                    </div>
                    <div>
                      <div className="text-xs neu-text">出荷日</div>
                      <div
                        className={`text-sm font-semibold ${
                          isUrgent ? "text-orange-500" : "neu-text-strong"
                        }`}
                      >
                        {formatDate(order.shippingDate)}
                        {isUrgent && <AlertDot />}
                      </div>
                    </div>
                  </div>

                  <div className="neu-divider h-10 w-px self-center" />

                  <div className="flex items-start gap-2.5">
                    <div className="neu-icon-box flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[#5f6b7a]">
                      <PackageIcon />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs neu-text">商品</div>
                      <div className="text-sm font-semibold neu-text-strong">
                        {order.items.length} 点
                      </div>
                      <div className="mt-0.5 text-xs leading-snug neu-text">
                        {order.items
                          .map((item) => `${item.product.name} ${item.boxes}箱`)
                          .join("、")}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                {action && (
                  <button
                    onClick={() => handleTransition(order.id, action.next)}
                    disabled={transitioning === order.id}
                    className="neu-btn-primary flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-base font-semibold disabled:opacity-60 sm:py-4"
                  >
                    {transitioning === order.id ? (
                      "処理中..."
                    ) : (
                      <>
                        {action.label}
                        <ChevronRightIcon />
                      </>
                    )}
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
