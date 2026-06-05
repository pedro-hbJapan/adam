import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function WarehouseDashboard() {
  const session = await auth();
  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 700 }}>
        WAREHOUSEダッシュボード
      </h1>
      <p style={{ color: "#666" }}>ようこそ、{session?.user?.name} さん</p>
      <div
        style={{
          marginTop: "1.5rem",
          background: "white",
          borderRadius: 10,
          padding: "1.5rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          maxWidth: 600,
        }}
      >
        <Link
          href="/warehouse/orders"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            color: "white",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          注文管理を開く →
        </Link>
      </div>
    </div>
  );
}
