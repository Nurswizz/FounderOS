import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "./prisma";

export async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  return session.user.id;
}

export async function requireStartup() {
  const userId = await requireUserId();
  const startup = await prisma.startup.findUnique({ where: { userId } });
  if (!startup) redirect("/onboarding");
  return startup;
}

export { githubToken } from "./integrations/github";
