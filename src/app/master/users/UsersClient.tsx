"use client";

import { useState, useTransition } from "react";
import { createUser, updateUserRole, deleteUser } from "./actions";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["MASTER", "OFFICE", "WAREHOUSE", "SALES", "CUSTOMER"];

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export function UsersClient({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER" as Role,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function refreshPage() {
    window.location.reload();
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess("ユーザーを作成しました。");
        setFormData({ name: "", email: "", password: "", role: "CUSTOMER" });
        setShowForm(false);
        refreshPage();
      }
    });
  }

  async function handleRoleChange(id: string, role: Role) {
    startTransition(async () => {
      const result = await updateUserRole(id, role);
      if (result.error) {
        setError(result.error);
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, role } : u))
        );
      }
    });
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`${email} を削除しますか？`)) return;
    startTransition(async () => {
      const result = await deleteUser(id);
      if (result.error) {
        setError(result.error);
      } else {
        setUsers((prev) => prev.filter((u) => u.id !== id));
      }
    });
  }

  return (
    <div>
      {error && (
        <div style={alertStyle("error")}>{error}</div>
      )}
      {success && (
        <div style={alertStyle("success")}>{success}</div>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        style={btnStyle("primary")}
      >
        {showForm ? "キャンセル" : "+ 新規ユーザー作成"}
      </button>

      {showForm && (
        <form onSubmit={handleCreate} style={formStyle}>
          <h3 style={{ margin: "0 0 1rem" }}>新規ユーザー</h3>
          <div style={fieldStyle}>
            <label style={labelStyle}>名前</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={inputStyle}
              placeholder="山田 太郎"
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>メールアドレス</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={inputStyle}
              placeholder="user@example.com"
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>パスワード</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              style={inputStyle}
              placeholder="8文字以上"
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>役職</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              style={inputStyle}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={isPending} style={btnStyle("primary")}>
            {isPending ? "作成中..." : "作成"}
          </button>
        </form>
      )}

      <div style={{ marginTop: "1.5rem", overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {["名前", "メールアドレス", "役職", "作成日", "操作"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={tdStyle}>{user.name}</td>
                <td style={tdStyle}>{user.email}</td>
                <td style={tdStyle}>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                    disabled={isPending}
                    style={{ ...inputStyle, padding: "0.3rem 0.5rem", fontSize: "0.85rem" }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td style={tdStyle}>
                  {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                </td>
                <td style={tdStyle}>
                  <button
                    onClick={() => handleDelete(user.id, user.email)}
                    disabled={isPending}
                    style={btnStyle("danger")}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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

function btnStyle(variant: "primary" | "danger"): React.CSSProperties {
  return {
    padding: "0.5rem 1rem",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    background: variant === "primary" ? "#667eea" : "#e53e3e",
    color: "white",
    marginBottom: variant === "primary" ? "1rem" : 0,
  };
}

const formStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 10,
  padding: "1.5rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  maxWidth: 480,
  marginBottom: "1.5rem",
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
