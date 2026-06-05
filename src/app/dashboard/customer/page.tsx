import { auth } from "@/lib/auth";

export default async function CustomerDashboard() {
  const session = await auth();
  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 700 }}>
        CUSTOMERダッシュボード
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
          color: "#888",
        }}
      >
        カスタマー向け機能はv0.2以降で追加予定です。
      </div>
    </div>
  );
}
