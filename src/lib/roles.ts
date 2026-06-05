import { Role } from "@prisma/client";

export const ROLE_DASHBOARD: Record<Role, string> = {
  MASTER: "/dashboard/master",
  OFFICE: "/dashboard/office",
  WAREHOUSE: "/dashboard/warehouse",
  SALES: "/dashboard/sales",
  CUSTOMER: "/dashboard/customer",
};

export function getDashboardPath(role: Role): string {
  return ROLE_DASHBOARD[role] ?? "/dashboard/customer";
}
