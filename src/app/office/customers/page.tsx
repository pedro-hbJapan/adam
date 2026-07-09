"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Customer {
  id: string;
  name: string;
  address: string;
  createdAt: string;
}

export default function CustomersPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function fetchCustomers() {
    fetch("/api/customers")
      .then((r) => r.json())
      .then(setCustomers);
  }

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.fieldErrors?.name?.[0] || "登録に失敗しました");
        return;
      }
      const customer = await res.json();
      setCustomers((prev) => [customer, ...prev]);
      setName("");
      setAddress("");
      setSuccess("届け先を登録しました");
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("削除しますか?")) return;
    try {
      const res = await fetch(`/api/customers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "削除に失敗しました");
        return;
      }
      fetchCustomers();
      setSuccess("届け先を削除しました");
    } catch {
      setError("通信エラーが発生しました");
    }
  }

  return (
    <div>
      <h1 style={heading}>届け先管理</h1>

      <form onSubmit={handleSubmit} style={formStyle}>
        <h3 style={{ margin: "0 0 1rem" }}>新規届け先登録</h3>
        {error && <div style={alertStyle("error")}>{error}</div>}
        {success && <div style={alertStyle("success")}>{success}</div>}
        <div style={fieldStyle}>
          <label style={labelStyle}>届け先名</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={inputStyle}
            placeholder="株式会社○○"
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>住所</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            style={inputStyle}
            placeholder="東京都..."
          />
        </div>
        <button type="submit" disabled={loading} style={btnPrimary}>
          {loading ? "登録中..." : "登録"}
        </button>
      </form>

      <div style={{ marginTop: "1.5rem", overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {["届け先名", "住所", "登録日", "操作"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={tdStyle}>{c.name}</td>
                <td style={tdStyle}>{c.address}</td>
                <td style={tdStyle}>
                  {new Date(c.createdAt).toLocaleDateString("ja-JP")}
                </td>
                <td style={tdStyle}>
                  {role === "MASTER" && (
                    <button onClick={() => handleDelete(c.id)} style={btnDanger}>
                      削除
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...tdStyle, color: "#999", textAlign: "center" }}>
                  届け先が登録されていません
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

function alertStyle(type: "error" | "success"): React.CSSProperties {
  return {
    padding: "0.75rem 1rem",
    borderRadius: 6,
    marginBottom: "1rem",
    background: type === "error" ? "#fff5f5" : "#f0fff4",
    color: type === "error" ? "#c53030" : "#276749",
    border: `1px solid ${type === "error" ? "#fed7d7" : "#c6f6d5"}`,
    fontSize: "0.875rem",
  };
}

const formStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 10,
  padding: "1.5rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  maxWidth: 480,
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

const btnDanger: React.CSSProperties = {
  padding: "0.3rem 0.6rem",
  borderRadius: 6,
  border: "none",
  cursor: "pointer",
  fontSize: "0.875rem",
  background: "#e53e3e",
  color: "white",
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
