import Link from "next/link";
import { AgentAvatar } from "@/components/agent-ui";
import { PendingActionRow } from "@/components/pending-action";
import { Empty, PageHeader, Section } from "@/components/ui";
import { AGENTS } from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import { requireStartup } from "@/lib/session";

export default async function InboxPage() {
  const startup = await requireStartup();
  const actions = await prisma.pendingAction.findMany({
    where: { startupId: startup.id },
    include: { run: { select: { id: true, agent: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const pending = actions.filter((a) => a.status === "PENDING");
  const resolved = actions.filter((a) => a.status !== "PENDING");

  const list = (items: typeof actions) => (
    <ul className="-my-1 divide-y divide-zinc-100 dark:divide-zinc-900">
      {items.map((a) => (
        <li key={a.id} className="flex gap-3">
          <Link href={`/team/runs/${a.run.id}`} className="pt-3" title={AGENTS[a.run.agent].title}>
            <AgentAvatar agent={a.run.agent} size="sm" />
          </Link>
          <div className="min-w-0 flex-1"><PendingActionRow action={a} /></div>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader title="Одобрения" subtitle="Действия агентов во внешних сервисах выполняются только после вашего решения" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title={`Ждут решения · ${pending.length}`}>{pending.length ? list(pending) : <Empty>Всё разобрано</Empty>}</Section>
        <Section title="История">{resolved.length ? list(resolved) : <Empty>Пока пусто</Empty>}</Section>
      </div>
    </>
  );
}
