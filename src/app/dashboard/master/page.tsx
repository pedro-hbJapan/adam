import { auth } from "@/lib/auth";
import Link from "next/link";

const OFFICE_LINKS = [
  { href: "/office/inventory", label: "在庫管理" },
  { href: "/office/shipments", label: "出荷指示書" },
];

const WAREHOUSE_LINKS = [
  { href: "/warehouse/orders", label: "倉庫注文管理" },
];

export default async function MasterDashboard() {
  const session = await auth();
  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 700 }}>
        MASTERダッシュボード
      </h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        ようこそ、{session?.user?.name} さん
      </p>

      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 0.5rem" }}>システム概要</h3>
        <p style={{ margin: 0, color: "#666" }}>
          Adam v0.2 - 社内統合プラットフォームが稼働中です。
          <br />
          左メニューまたは下のリンクから各機能にアクセスできます。
        </p>
      </div>

      <h2 style={{ margin: "2rem 0 0.75rem", fontSize: "1.1rem", fontWeight: 600 }}>
        OFFICE機能
      </h2>
      <div style={gridStyle}>
        {OFFICE_LINKS.map((link) => (
          <Link key={link.href} href={link.href} style={linkCardStyle}>
            {link.label}
          </Link>
        ))}
      </div>

      <h2 style={{ margin: "2rem 0 0.75rem", fontSize: "1.1rem", fontWeight: 600 }}>
        WAREHOUSE機能
      </h2>
      <div style={gridStyle}>
        {WAREHOUSE_LINKS.map((link) => (
          <Link key={link.href} href={link.href} style={linkCardStyle}>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 10,
  padding: "1.5rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  maxWidth: 600,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: "0.75rem",
  maxWidth: 600,
};

const linkCardStyle: React.CSSProperties = {
  display: "block",
  background: "white",
  borderRadius: 8,
  padding: "1rem 1.25rem",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
  color: "#1a1a1a",
  textDecoration: "none",
  fontWeight: 500,
  fontSize: "0.95rem",
  border: "1px solid #e5e7eb",
  transition: "box-shadow 0.15s",
};
