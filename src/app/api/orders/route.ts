import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where = status ? { status: status as "PENDING" | "FEASIBLE" | "PRODUCED" | "PICKED" } : {};

  const orders = await prisma.order.findMany({
    where,
    include: { customer: true, items: { include: { product: true } }, createdBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

const itemSchema = z.object({
  productId: z.string().min(1),
  boxes: z.number().int().min(1),
  unitsPerBox: z.number().int().min(1),
});

const createSchema = z.object({
  customerId: z.string().min(1),
  shippingDate: z.string().datetime(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "OFFICE" && role !== "MASTER") {
    return NextResponse.json({ error: "Forbidden: OFFICE or MASTER role required" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Generate order number: ORD-YYYYMMDD-XXXX
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const count = await prisma.order.count({
    where: {
      orderNumber: { startsWith: `ORD-${dateStr}-` },
    },
  });
  const orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, "0")}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: parsed.data.customerId,
      shippingDate: new Date(parsed.data.shippingDate),
      createdById: session.user.id,
      items: {
        create: parsed.data.items.map((item) => ({
          productId: item.productId,
          boxes: item.boxes,
          unitsPerBox: item.unitsPerBox,
        })),
      },
    },
    include: { customer: true, items: { include: { product: true } } },
  });

  return NextResponse.json(order, { status: 201 });
}
