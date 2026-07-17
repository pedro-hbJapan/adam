import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";

const masterNav = [
  { href: "/dashboard/master", label: "ダッシュボード" },
  { href: "/master/users", label: "ユーザー管理" },
  { href: "/office/inventory", label: "在庫管理" },
  { href: "/office/shipments", label: "出荷指示書" },
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
