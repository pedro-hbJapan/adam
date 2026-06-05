import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "master@example.com" },
  });

  if (!existing) {
    const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
