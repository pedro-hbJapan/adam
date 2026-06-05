"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  janCode: string;
  name: string;
}

interface Customer {
  id: string;
  name: string;
  address: string;
}

interface OrderItem {
  productId: string;
  boxes: number;
  unitsPerBox: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [shippingDate, setShippingDate] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { productId: "", boxes: 1, unitsPerBox: 1 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
    ]).then(([p, c]) => {
      setProducts(p);
      setCustomers(c);
    });
  }, []);

  function addItem() {
    setItems([...items, { productId: "", boxes: 1, unitsPerBox: 1 }]);
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof OrderItem, value: string | number) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!customerId) { setError("取引先を選択してください"); return; }
    if (!shippingDate) { setError("出荷日を入力してください"); return; }
    if (items.some((it) => !it.productId)) { setError("商品を選択してください"); return; }
    setConfirm(true);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          shippingDate: new Date(shippingDate).toISOString(),
          items: items.map((it) => ({
            productId: it.productId,
            boxes: Number(it.boxes),
            unitsPerBox: Number(it.unitsPerBox),
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "注文作成に失敗しました");
        setConfirm(false);
        return;
      }
      router.push("/office/orders");
    } catch {
      setError("通信エラーが発生しました");
      setConfirm(false);
    } finally {
      setLoading(false);
    }
  }

  const selectedCustomer = customers.find((c) => c.id === customerId);

  if (confirm) {
    return (
      <div>
        <h1 style={heading}>注文内容確認</h1>
        <div style={cardStyle}>
          <p><strong>取引先:</strong> {selectedCustomer?.name}</p>
          <p><strong>出荷日:</strong> {shippingDate}</p>
          <table style={{ ...tableStyle, marginTop: "1rem" }}>
            <thead>
              <tr>
                {["商品", "箱数", "入数"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const prod = products.find((p) => p.id === it.productId);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={tdStyle}>{prod?.name ?? "-"}</td>
                    <td style={tdStyle}>{it.boxes}</td>
                    <td style={tdStyle}>{it.unitsPerBox}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {error && <div style={alertError}>{error}</div>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button onClick={() => setConfirm(false)} style={btnSecondary}>
              戻る
            </button>
            <button onClick={handleSubmit} disabled={loading} style={btnPrimary}>
              {loading ? "送信中..." : "注文を確定"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={heading}>注文作成</h1>
      <form onSubmit={handleConfirm} style={cardStyle}>
        {error && <div style={alertError}>{error}</div>}

        <div style={fieldStyle}>
          <label style={labelStyle}>取引先</label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={inputStyle}
            required
          >
            <option value="">選択してください</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>出荷日</label>
          <input
            type="date"
            value={shippingDate}
            onChange={(e) => setShippingDate(e.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginTop: "0.5rem" }}>
          <label style={labelStyle}>商品明細</label>
          {items.map((item, idx) => (
            <div key={idx} style={itemRow}>
              <select
                value={item.productId}
                onChange={(e) => updateItem(idx, "productId", e.target.value)}
                style={{ ...inputStyle, flex: 2 }}
                required
              >
                <option value="">商品を選択</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.janCode})</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={item.boxes}
                onChange={(e) => updateItem(idx, "boxes", Number(e.target.value))}
                style={{ ...inputStyle, width: 80 }}
                placeholder="箱数"
              />
              <input
                type="number"
                min={1}
                value={item.unitsPerBox}
                onChange={(e) => updateItem(idx, "unitsPerBox", Number(e.target.value))}
                style={{ ...inputStyle, width: 80 }}
                placeholder="入数"
              />
              {items.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} style={btnDanger}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addItem} style={{ ...btnSecondary, marginTop: "0.5rem" }}>
            + 行追加
          </button>
        </div>

        <button type="submit" style={{ ...btnPrimary, marginTop: "1rem" }}>
          確認画面へ
        </button>
      </form>
    </div>
  );
}

const heading: React.CSSProperties = {
  margin: "0 0 1.5rem",
  fontSize: "1.75rem",
  fontWeight: 700,
};

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 10,
  padding: "1.5rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  maxWidth: 700,
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.875rem",
  fontWeight: 600,
  color: "#555",
};

const inputStyle: React.CSSProperties = {
  padding: "0.6rem 0.8rem",
  borderRadius: 6,
  border: "1.5px solid #ddd",
  fontSize: "0.95rem",
};

const itemRow: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "center",
  marginTop: "0.5rem",
};

const btnPrimary: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 600,
  background: "#667eea",
  color: "white",
};

const btnSecondary: React.CSSProperties = {
  padding: "0.5rem 1rem",
  borderRadius: 6,
  border: "1.5px solid #ddd",
  cursor: "pointer",
  fontSize: "0.875rem",
  fontWeight: 600,
  background: "white",
  color: "#333",
};

const btnDanger: React.CSSProperties = {
  padding: "0.3rem 0.6rem",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontSize: "0.875rem",
  background: "#e53e3e",
  color: "white",
};

const alertError: React.CSSProperties = {
  padding: "0.75rem 1rem",
  borderRadius: 6,
  marginBottom: "0.5rem",
  background: "#fff5f5",
  color: "#c53030",
  border: "1px solid #fed7d7",
  fontSize: "0.875rem",
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
