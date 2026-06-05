import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDashboardPath } from "@/lib/roles";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";
import type { Role } from "@prisma/client";

const ROLE_NAV: Record<Role, Array<{ href: string; label: string }>> = {
  MASTER: [
    { href: "/dashboard/master", label: "ダッシュボード" },
    { href: "/master/users", label: "ユーザー管理" },
  ],
  OFFICE: [{ href: "/dashboard/office", label: "ダッシュボード" }],
  WAREHOUSE: [{ href: "/dashboard/warehouse", label: "ダッシュボード" }],
  SALES: [{ href: "/dashboard/sales", label: "ダッシュボード" }],
  CUSTOMER: [{ href: "/dashboard/customer", label: "ダッシュボード" }],
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as Role;
  const navItems = ROLE_NAV[role] ?? ROLE_NAV.CUSTOMER;

  return (
    <DashboardLayoutClient
      userName={session.user.name ?? "ユーザー"}
      userRole={role}
      navItems={navItems}
    >
      {children}
    </DashboardLayoutClient>
  );
}
