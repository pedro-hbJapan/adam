import { auth } from "@/lib/auth";

export default async function WarehouseDashboard() {
  const session = await auth();
  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 700 }}>
        WAREHOUSEダッシュボード
      </h1>
      <p style={{ color: "#666" }}>ようこそ、{session?.user?.name} さん</p>

    </div>
  );
}
