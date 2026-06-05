import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import type { Role } from "@prisma/client";

// Role → home dashboard mapping
const ROLE_DASHBOARD: Record<string, string> = {
  MASTER: "/dashboard/master",
  OFFICE: "/dashboard/office",
  WAREHOUSE: "/dashboard/warehouse",
  SALES: "/dashboard/sales",
  CUSTOMER: "/dashboard/customer",
};

// Route → allowed roles
const ROLE_PATHS: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/dashboard/master", roles: ["MASTER"] },
  { prefix: "/dashboard/office", roles: ["OFFICE", "MASTER"] },
  { prefix: "/dashboard/warehouse", roles: ["WAREHOUSE", "MASTER"] },
  { prefix: "/dashboard/sales", roles: ["SALES", "MASTER"] },
  { prefix: "/dashboard/customer", roles: ["CUSTOMER", "MASTER"] },
  { prefix: "/master/users", roles: ["MASTER"] },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip public/static routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Not authenticated → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = (token.role as string) ?? "CUSTOMER";

  // Check route-level permissions
  for (const { prefix, roles } of ROLE_PATHS) {
    if (pathname.startsWith(prefix)) {
      if (!roles.includes(role)) {
        const home = ROLE_DASHBOARD[role] ?? "/dashboard/customer";
        return NextResponse.redirect(new URL(home, req.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
