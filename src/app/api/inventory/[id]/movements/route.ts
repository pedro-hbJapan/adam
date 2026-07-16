import { prisma } from "@/lib/prisma";
import { requireOfficeOrMaster } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireOfficeOrMaster();
  if (error) return error;

  const { id } = await params;

  const movements = await prisma.stockMovement.findMany({
    where: { itemId: id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(movements);
}
