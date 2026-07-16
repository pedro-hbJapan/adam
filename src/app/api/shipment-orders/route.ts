import { prisma } from "@/lib/prisma";
import { requireOfficeOrMaster } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

async function generateOrderNumber(shipDate: Date): Promise<string> {
  const y = shipDate.getFullYear();
  const m = String(shipDate.getMonth() + 1).padStart(2, "0");
  const d = String(shipDate.getDate()).padStart(2, "0");
  const prefix = `SHP-${y}${m}${d}-`;

  const last = await prisma.shipmentOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
  });

  let seq = 1;
  if (last) {
    const lastSeq = parseInt(last.orderNumber.slice(prefix.length), 10);
    if (!Number.isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export async function GET() {
  const { error } = await requireOfficeOrMaster();
  if (error) return error;

  const orders = await prisma.shipmentOrder.findMany({
    orderBy: { shipDate: "desc" },
    include: { items: true },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const { error } = await requireOfficeOrMaster();
  if (error) return error;

  const body = await req.json();
  const { shipDate, note, items } = body;

  if (!shipDate || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "必須項目が不足しています。" }, { status: 400 });
  }

  const shipDateObj = new Date(shipDate);
  const orderNumber = await generateOrderNumber(shipDateObj);

  const order = await prisma.shipmentOrder.create({
    data: {
      orderNumber,
      shipDate: shipDateObj,
      note: note ?? null,
      items: {
        create: items.map((it: { itemId: string; quantity: number; note?: string }) => ({
          itemId: it.itemId,
          quantity: Number(it.quantity),
          note: it.note ?? null,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(order, { status: 201 });
}
