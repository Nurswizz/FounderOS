import { prisma } from "@/lib/prisma";

export async function resetDb() {
  await prisma.$executeRawUnsafe('TRUNCATE "User", "Startup" CASCADE');
}

export async function createStartup(name = "Acme") {
  const user = await prisma.user.create({ data: { email: `${name}-${Date.now()}@test.dev` } });
  return prisma.startup.create({
    data: { userId: user.id, name, description: "CRM для автомоек", industry: "SaaS", stage: "VALIDATION" },
  });
}
