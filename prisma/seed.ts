import { PrismaClient, Role, MovementType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  // Seed users
  const existing = await prisma.user.findUnique({
    where: { email: "master@example.com" },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        email: "master@example.com",
        passwordHash,
        name: "Master Admin",
        role: Role.MASTER,
      },
    });
    console.log("Seed: MASTER user created (master@example.com)");
  } else {
    console.log("Seed: MASTER user already exists, skipping.");
  }

  // Seed inventory items (テスト商品3件)
  const items = [
    {
      janCode: "4901234567890",
      name: "北海道産大豆 1kg",
      manufacturer: "北海道フーズ株式会社",
      supplier: "豆卸センター",
      specification: "1ケース/12個入",
      unitsPerCase: 12,
      expirationDate: new Date("2027-03-31"),
    },
    {
      janCode: "4901234567891",
      name: "丹波黒豆 500g",
      manufacturer: "丹波黒豆本舗",
      supplier: null,
      specification: "1ケース/20個入",
      unitsPerCase: 20,
      expirationDate: new Date("2027-06-30"),
    },
    {
      janCode: "4901234567892",
      name: "小豆 赤 800g",
      manufacturer: "有限会社まめ工房",
      supplier: "豆卸センター",
      specification: "1ケース/10個入",
      unitsPerCase: 10,
      expirationDate: null,
    },
  ];

  const createdItems = [];
  for (const i of items) {
    const item = await prisma.inventoryItem.upsert({
      where: { janCode: i.janCode },
      update: {},
      create: i,
    });
    createdItems.push(item);
  }
  console.log("Seed: 3 inventory items created/verified.");

  // Seed stock movements (入出荷履歴)
  const existingMovements = await prisma.stockMovement.count();
  if (existingMovements === 0) {
    await prisma.stockMovement.createMany({
      data: [
        {
          itemId: createdItems[0].id,
          type: MovementType.IN,
          date: new Date("2026-06-01"),
          quantity: 50,
          note: "初回入荷",
        },
        {
          itemId: createdItems[0].id,
          type: MovementType.OUT,
          date: new Date("2026-06-15"),
          quantity: 10,
          note: "出荷分",
        },
        {
          itemId: createdItems[1].id,
          type: MovementType.IN,
          date: new Date("2026-06-05"),
          quantity: 30,
          note: "初回入荷",
        },
        {
          itemId: createdItems[2].id,
          type: MovementType.IN,
          date: new Date("2026-06-10"),
          quantity: 20,
          note: "初回入荷",
        },
      ],
    });
    console.log("Seed: 4 stock movements created.");
  } else {
    console.log("Seed: stock movements already exist, skipping.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
