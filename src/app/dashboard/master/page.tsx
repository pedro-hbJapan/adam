import { auth } from "@/lib/auth";

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
          Adam v0.1 - 社内統合プラットフォーム基盤が稼働中です。
          <br />
          左メニューの「ユーザー管理」からユーザーの作成・編集・削除が行えます。
        </p>
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
