import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function OfficeDashboard() {
  const session = await auth();
  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 700 }}>
        OFFICEダッシュボード
      </h1>
      <p style={{ color: "#666" }}>ようこそ、{session?.user?.name} さん</p>

      <div style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem", maxWidth: 800 }}>
        <DashCard href="/office/orders" title="注文一覧" desc="注文のステータス・ピッキング状況を確認" />
        <DashCard href="/office/orders/new" title="注文作成" desc="新しい注文を作成する" />
        <DashCard href="/office/products" title="商品マスタ" desc="商品の登録・一覧" />
        <DashCard href="/office/customers" title="届け先" desc="届け先の登録・一覧" />
      </div>
    </div>
  );
}

function DashCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          background: "white",
          borderRadius: 10,
          padding: "1.5rem",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          transition: "box-shadow 0.15s",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.4rem" }}>
          {title}
        </div>
        <div style={{ fontSize: "0.85rem", color: "#888" }}>{desc}</div>
      </div>
    </Link>
  );
}
