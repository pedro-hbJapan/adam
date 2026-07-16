import { prisma } from "@/lib/prisma";
import { requireOfficeOrMaster } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { error } = await requireOfficeOrMaster();
  if (error) return error;

  const body = await req.json();
  const { itemId, type, date, quantity, note } = body;

  if (!itemId || !type || !date || quantity === undefined) {
    return NextResponse.json({ error: "必須項目が不足しています。" }, { status: 400 });
  }

  if (type !== "IN" && type !== "OUT") {
    return NextResponse.json({ error: "typeはIN/OUTのいずれかです。" }, { status: 400 });
  }

  const movement = await prisma.stockMovement.create({
    data: {
      itemId,
      type,
      date: new Date(date),
      quantity: Number(quantity),
      note: note ?? null,
    },
  });

  return NextResponse.json(movement, { status: 201 });
}
