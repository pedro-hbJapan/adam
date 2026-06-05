import { prisma } from "@/lib/prisma";
import { UsersClient } from "./UsersClient";
import type { Role } from "@prisma/client";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h1 style={{ margin: "0 0 1.5rem", fontSize: "1.75rem", fontWeight: 700 }}>
        ユーザー管理
      </h1>
      <UsersClient
        users={users.map((u) => ({
          ...u,
          role: u.role as Role,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
