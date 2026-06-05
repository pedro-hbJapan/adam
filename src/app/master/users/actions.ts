"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Role } from "@prisma/client";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["MASTER", "OFFICE", "WAREHOUSE", "SALES", "CUSTOMER"]),
});

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const parsed = createUserSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "入力値が不正です。" };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "このメールアドレスは既に使用されています。" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role as Role,
    },
  });

  revalidatePath("/master/users");
  return { success: true };
}

export async function updateUserRole(id: string, role: Role) {
  try {
    await prisma.user.update({
      where: { id },
      data: { role },
    });
    revalidatePath("/master/users");
    return { success: true };
  } catch {
    return { error: "役職の更新に失敗しました。" };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/master/users");
    return { success: true };
  } catch {
    return { error: "ユーザーの削除に失敗しました。" };
  }
}
