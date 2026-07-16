import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

export async function requireOfficeOrMaster() {
  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!role || (role !== "OFFICE" && role !== "MASTER")) {
    return {
      session: null,
      error: NextResponse.json({ error: "権限がありません。" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
