import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardPath } from "@/lib/roles";
import type { Role } from "@prisma/client";

const ROLE_PATHS: Record<string, Role[]> = {
  "/dashboard/master": ["MASTER"],
  "/dashboard/office": ["OFFICE", "MASTER"],
  "/dashboard/warehouse": ["WAREHOUSE", "MASTER"],
  "/dashboard/sales": ["SALES", "MASTER"],
  "/dashboard/customer": ["CUSTOMER", "MASTER"],
  "/master/users": ["MASTER"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes
  if (pathname.startsWith("/api/auth") || pathname === "/login") {
    return NextResponse.next();
  }

  const session = req.auth;

  // Not authenticated → redirect to login
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = session.user.role as Role;

  // Check route permissions
  for (const [path, allowedRoles] of Object.entries(ROLE_PATHS)) {
    if (pathname.startsWith(path)) {
      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL(getDashboardPath(role), req.url));
      }
      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/master/:path*",
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
