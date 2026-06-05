import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";

const STATUS_FLOW: OrderStatus[] = ["PENDING", "FEASIBLE", "PRODUCED", "PICKED"];

const patchSchema = z.object({
  status: z.enum(["PENDING", "FEASIBLE", "PRODUCED", "PICKED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role;
  if (role !== "WAREHOUSE" && role !== "MASTER") {
    return NextResponse.json({ error: "Forbidden: WAREHOUSE or MASTER role required" }, { status: 403 });
  }

  const { id } = await params;

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Validate transition: must be exactly one step forward
  const currentIdx = STATUS_FLOW.indexOf(order.status);
  const nextIdx = STATUS_FLOW.indexOf(parsed.data.status);

  if (nextIdx !== currentIdx + 1) {
    return NextResponse.json(
      { error: `Invalid transition: ${order.status} → ${parsed.data.status}. Must follow PENDING→FEASIBLE→PRODUCED→PICKED.` },
      { status: 422 }
    );
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { status: parsed.data.status },
    include: { customer: true, items: { include: { product: true } } },
  });

  return NextResponse.json(updated);
}
