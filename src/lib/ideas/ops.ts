import { prisma } from "../prisma";

export function latestSession(userId: string) {
  return prisma.ideaSession.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
}

export function startSession(userId: string) {
  return prisma.ideaSession.create({ data: { userId } });
}

export async function sendIdeaMessage(userId: string, text: string) {
  const session = (await latestSession(userId)) ?? (await startSession(userId));
  // Атомарно занимаем сессию: пока агент отвечает, новые сообщения не принимаем.
  const { count } = await prisma.ideaSession.updateMany({
    where: { id: session.id, thinking: false },
    data: { thinking: true },
  });
  if (!count) return { session, accepted: false };

  await prisma.ideaMessage.create({ data: { sessionId: session.id, role: "user", content: text } });
  return { session: { ...session, thinking: true }, accepted: true };
}

export function ideaForUser(userId: string, ideaId: string) {
  return prisma.ideaCandidate.findFirst({ where: { id: ideaId, session: { userId } } });
}

export type Evidence = { claim: string; url: string }[];

// Исследование по идее в Markdown — сохраняется в хаб созданного проекта.
export function ideaResearchMarkdown(idea: {
  title: string;
  problem: string;
  customer: string;
  solution: string;
  whyNow: string;
  risks: string;
  evidence: unknown;
}) {
  const evidence = (idea.evidence as Evidence).map((e) => `- ${e.claim} — [источник](${e.url})`);
  return [
    `# ${idea.title}`,
    `## Проблема\n${idea.problem}`,
    `## Клиент\n${idea.customer}`,
    `## Решение\n${idea.solution}`,
    `## Почему сейчас\n${idea.whyNow}`,
    `## Риски\n${idea.risks}`,
    `## Факты и источники\n${evidence.join("\n") || "—"}`,
  ].join("\n\n");
}
