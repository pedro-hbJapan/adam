import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";

const officeNav = [
  { href: "/office/products", label: "商品マスタ" },
  { href: "/office/customers", label: "取引先" },
  { href: "/office/orders/new", label: "注文作成" },
  { href: "/office/orders", label: "注文一覧" },
];

export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  if (role !== "OFFICE" && role !== "MASTER") redirect("/login");

  return (
    <DashboardLayoutClient
      userName={session.user.name ?? "ユーザー"}
      userRole={role ?? "OFFICE"}
      navItems={officeNav}
    >
      {children}
    </DashboardLayoutClient>
  );
}
