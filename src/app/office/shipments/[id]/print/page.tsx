"use client";

import { useEffect, useState, use as usePromise } from "react";

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
  status: string;
  note: string | null;
  items: ShipmentOrderItem[];
}

export default function ShipmentPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = usePromise(params);
  const [order, setOrder] = useState<ShipmentOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/shipment-orders/${id}`);
        if (res.ok) {
          setOrder(await res.json());
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return <p style={{ padding: "2rem" }}>読み込み中...</p>;
  }

  if (!order) {
    return <p style={{ padding: "2rem" }}>見つかりません。</p>;
  }

  return (
    <div className="print-page">
      <div className="no-print" style={{ padding: "1rem", textAlign: "right" }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: "0.6rem 1.4rem",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          印刷する
        </button>
      </div>

      <div className="sheet">
        <h1 style={{ textAlign: "center", fontSize: "1.5rem", marginBottom: "1.5rem" }}>
          出荷指示書
        </h1>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", fontSize: "0.95rem" }}>
          <div>注文番号: {order.orderNumber}</div>
          <div>出荷予定日: {new Date(order.shipDate).toLocaleDateString("ja-JP")}</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
          <thead>
            <tr>
              {["商品名", "JANコード", "メーカー", "規格", "数量"].map((h) => (
                <th
                  key={h}
                  style={{
                    border: "1px solid #333",
                    padding: "0.5rem 0.75rem",
                    background: "#eee",
                    textAlign: "left",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {order.items.map((oi) => (
              <tr key={oi.id}>
                <td style={{ border: "1px solid #333", padding: "0.5rem 0.75rem" }}>
                  {oi.item.name}
                </td>
                <td style={{ border: "1px solid #333", padding: "0.5rem 0.75rem" }}>
                  {oi.item.janCode}
                </td>
                <td style={{ border: "1px solid #333", padding: "0.5rem 0.75rem" }}>
                  {oi.item.manufacturer}
                </td>
                <td style={{ border: "1px solid #333", padding: "0.5rem 0.75rem" }}>
                  {oi.item.specification}
                </td>
                <td style={{ border: "1px solid #333", padding: "0.5rem 0.75rem" }}>
                  {oi.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: "1.5rem", fontSize: "0.9rem" }}>
          <div style={{ fontWeight: 700, marginBottom: "0.3rem" }}>備考</div>
          <div style={{ minHeight: "3rem", border: "1px solid #333", padding: "0.5rem" }}>
            {order.note ?? ""}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
        .sheet {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 15mm;
          background: white;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}
