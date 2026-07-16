import { prisma } from "@/lib/prisma";
import { requireOfficeOrMaster } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET() {
  const { error } = await requireOfficeOrMaster();
  if (error) return error;

  const items = await prisma.inventoryItem.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      movements: {
        select: { type: true, quantity: true },
      },
    },
  });

  const result = items.map(({ movements, ...item }) => {
    const stock = movements.reduce(
      (sum, m) => sum + (m.type === "IN" ? m.quantity : -m.quantity),
      0
    );
    return { ...item, stock };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { error } = await requireOfficeOrMaster();
  if (error) return error;

  const body = await req.json();
  const {
    janCode,
    name,
    manufacturer,
    supplier,
    specification,
    unitsPerCase,
    expirationDate,
  } = body;

  if (!janCode || !name || !manufacturer || !specification || !unitsPerCase) {
    return NextResponse.json({ error: "必須項目が不足しています。" }, { status: 400 });
  }

  const item = await prisma.inventoryItem.create({
    data: {
      janCode,
      name,
      manufacturer,
      supplier: supplier ?? null,
      specification,
      unitsPerCase: Number(unitsPerCase),
      expirationDate: expirationDate ? new Date(expirationDate) : null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireOfficeOrMaster();
  if (error) return error;

  const body = await req.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "idは必須です。" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (fields.janCode !== undefined) data.janCode = fields.janCode;
  if (fields.name !== undefined) data.name = fields.name;
  if (fields.manufacturer !== undefined) data.manufacturer = fields.manufacturer;
  if (fields.supplier !== undefined) data.supplier = fields.supplier;
  if (fields.specification !== undefined) data.specification = fields.specification;
  if (fields.unitsPerCase !== undefined) data.unitsPerCase = Number(fields.unitsPerCase);
  if (fields.expirationDate !== undefined) {
    data.expirationDate = fields.expirationDate ? new Date(fields.expirationDate) : null;
  }

  const item = await prisma.inventoryItem.update({
    where: { id },
    data,
  });

  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireOfficeOrMaster();
  if (error) return error;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "idは必須です。" }, { status: 400 });
  }

  await prisma.inventoryItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
