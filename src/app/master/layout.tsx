import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";

const masterNav = [
  { href: "/dashboard/master", label: "ダッシュボード" },
  { href: "/master/users", label: "ユーザー管理" },
  { href: "/office/products", label: "商品マスタ" },
  { href: "/office/customers", label: "届け先" },
  { href: "/office/orders/new", label: "注文作成" },
  { href: "/office/orders", label: "注文一覧" },
  { href: "/warehouse/orders", label: "倉庫注文管理" },
];

export default async function MasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <DashboardLayoutClient
      userName={session.user.name ?? "ユーザー"}
      userRole={session.user.role ?? "MASTER"}
      navItems={masterNav}
    >
      {children}
    </DashboardLayoutClient>
  );
}
