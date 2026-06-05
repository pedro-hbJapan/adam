"use client";

import { useState, useEffect } from "react";

interface OrderItem {
  id: string;
  product: { id: string; name: string; janCode: string };
  boxes: number;
  unitsPerBox: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customer: { id: string; name: string };
  shippingDate: string;
  status: "PENDING" | "FEASIBLE" | "PRODUCED" | "PICKED";
  items: OrderItem[];
  createdBy: { id: string; name: string };
  createdAt: string;
}

const STATUS_LABELS: Record<Order["status"], string> = {
  PENDING: "受注済",
  FEASIBLE: "引当済",
  PRODUCED: "生産済",
  PICKED: "ピッキング済",
};

const STATUS_COLORS: Record<Order["status"], string> = {
  PENDING: "#f6ad55",
  FEASIBLE: "#4299e1",
  PRODUCED: "#9f7aea",
  PICKED: "#48bb78",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    const url = filterStatus ? `/api/orders?status=${filterStatus}` : "/api/orders";
    fetch(url)
      .then((r) => r.json())
      .then(setOrders);
  }, [filterStatus]);

  return (
    <div>
      <h1 style={heading}>注文一覧</h1>

      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "#555" }}>
          ステータス:
        </label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={selectStyle}
        >
          <option value="">すべて</option>
          <option value="PENDING">受注済</option>
          <option value="FEASIBLE">引当済</option>
          <option value="PRODUCED">生産済</option>
          <option value="PICKED">ピッキング済</option>
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {["注文番号", "取引先", "出荷日", "ステータス", "明細", "作成者", "作成日"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={tdStyle}>{order.orderNumber}</td>
                <td style={tdStyle}>{order.customer.name}</td>
                <td style={tdStyle}>
                  {new Date(order.shippingDate).toLocaleDateString("ja-JP")}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.6rem",
                      borderRadius: 12,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "white",
                      background: STATUS_COLORS[order.status],
                    }}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td style={tdStyle}>
                  {order.items.map((it) => (
                    <div key={it.id} style={{ fontSize: "0.8rem", color: "#555" }}>
                      {it.product.name} ×{it.boxes}箱({it.unitsPerBox}入)
                    </div>
                  ))}
                </td>
                <td style={tdStyle}>{order.createdBy.name}</td>
                <td style={tdStyle}>
                  {new Date(order.createdAt).toLocaleDateString("ja-JP")}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} style={{ ...tdStyle, color: "#999", textAlign: "center" }}>
                  注文がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const heading: React.CSSProperties = {
  margin: "0 0 1.5rem",
  fontSize: "1.75rem",
  fontWeight: 700,
};

const selectStyle: React.CSSProperties = {
  padding: "0.5rem 0.8rem",
  borderRadius: 6,
  border: "1.5px solid #ddd",
  fontSize: "0.9rem",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  background: "white",
  borderRadius: 10,
  borderCollapse: "collapse",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  overflow: "hidden",
};

const thStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  textAlign: "left",
  background: "#f8f9fa",
  fontSize: "0.8rem",
  fontWeight: 700,
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  fontSize: "0.9rem",
};
