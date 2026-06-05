import { PrismaClient, Role } from "@prisma/client";
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

  // Seed products (テスト商品3件)
  const products = [
    { janCode: "4901234567890", name: "北海道産大豆 1kg" },
    { janCode: "4901234567891", name: "丹波黒豆 500g" },
    { janCode: "4901234567892", name: "小豆 赤 800g" },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { janCode: p.janCode },
      update: {},
      create: p,
    });
  }
  console.log("Seed: 3 products created/verified.");

  // Seed customers (取引先2件)
  const customers = [
    { name: "株式会社 豆の里", address: "東京都中央区日本橋1-2-3" },
    { name: "有限会社 まめ屋", address: "大阪府大阪市北区梅田4-5-6" },
  ];

  for (const c of customers) {
    const ex = await prisma.customer.findFirst({ where: { name: c.name } });
    if (!ex) {
      await prisma.customer.create({ data: c });
    }
  }
  console.log("Seed: 2 customers created/verified.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
