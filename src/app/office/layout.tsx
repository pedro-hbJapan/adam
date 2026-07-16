import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardLayoutClient } from "@/components/DashboardLayoutClient";

const officeNav: { href: string; label: string }[] = [
  { href: "/office/inventory", label: "在庫管理" },
  { href: "/office/shipments", label: "出荷指示書" },
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
