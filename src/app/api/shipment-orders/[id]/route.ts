import { prisma } from "@/lib/prisma";
import { requireOfficeOrMaster } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireOfficeOrMaster();
  if (error) return error;

  const { id } = await params;

  const order = await prisma.shipmentOrder.findUnique({
    where: { id },
    include: { items: { include: { item: true } } },
  });

  if (!order) {
    return NextResponse.json({ error: "見つかりません。" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireOfficeOrMaster();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const { status, shipDate, note, items } = body;

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (shipDate !== undefined) data.shipDate = new Date(shipDate);
  if (note !== undefined) data.note = note;

  if (Array.isArray(items)) {
    await prisma.shipmentOrderItem.deleteMany({ where: { shipmentOrderId: id } });
    data.items = {
      create: items.map((it: { itemId: string; quantity: number; note?: string }) => ({
        itemId: it.itemId,
        quantity: Number(it.quantity),
        note: it.note ?? null,
      })),
    };
  }

  const order = await prisma.shipmentOrder.update({
    where: { id },
    data,
    include: { items: { include: { item: true } } },
  });

  return NextResponse.json(order);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireOfficeOrMaster();
  if (error) return error;

  const { id } = await params;

  await prisma.shipmentOrder.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
