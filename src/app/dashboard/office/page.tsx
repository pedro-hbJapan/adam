import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function OfficeDashboard() {
  const session = await auth();
  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 700 }}>
        OFFICEダッシュボード
      </h1>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        ようこそ、{session?.user?.name} さん
      </p>

      <div className="grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/office/inventory"
          className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-1 text-base font-bold">在庫管理</div>
          <div className="text-sm text-gray-500">在庫アイテムの登録・入出荷管理</div>
        </Link>
        <Link
          href="/office/shipments"
          className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-1 text-base font-bold">出荷指示書</div>
          <div className="text-sm text-gray-500">出荷指示書の作成・管理</div>
        </Link>
      </div>
    </div>
  );
}
