import Link from "next/link";
import { CalendarClock, Inbox, Send } from "lucide-react";
import { runAgent, toggleSchedule } from "@/app/actions";
import { AgentAvatar, LiveActivity, RunStatusBadge, timeAgo, triggerLabel } from "@/components/agent-ui";
import { AutoRefresh } from "@/components/auto-refresh";
import { SubmitButton } from "@/components/submit-button";
import { Empty, inputCls, PageHeader, Section } from "@/components/ui";
import { AGENT_LIST, AGENTS } from "@/lib/agents";
import { prisma } from "@/lib/prisma";
import { requireStartup } from "@/lib/session";

export default async function Team() {
  const startup = await requireStartup();
  const [runs, settings, pending] = await Promise.all([
    prisma.agentRun.findMany({ where: { startupId: startup.id }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.agentSetting.findMany({ where: { startupId: startup.id } }),
    prisma.pendingAction.count({ where: { startupId: startup.id, status: "PENDING" } }),
  ]);
  const active = runs.some((r) => r.status === "QUEUED" || r.status === "RUNNING");

  return (
    <>
      <AutoRefresh active={active} intervalMs={1500} />
      <PageHeader title="Команда" subtitle="AI-агенты, которые работают на ваш стартап">
        {pending ? (
          <Link href="/inbox" className="inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700">
            <Inbox size={14} /> Ждут одобрения
            <span className="rounded-full bg-indigo-600 px-1.5 text-xs font-medium text-white tabular-nums">{pending}</span>
          </Link>
        ) : null}
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
        {AGENT_LIST.map((agent) => {
          const last = runs.find((r) => r.agent === agent.key);
          const scheduled = settings.find((s) => s.agent === agent.key)?.scheduleEnabled ?? false;
          return (
            <section key={agent.key} className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-5 motion-safe:animate-fade-up dark:border-zinc-800">
              <div className="flex items-start gap-3">
                <AgentAvatar agent={agent.key} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-medium">{agent.title}</h2>
                  <p className="text-sm text-zinc-500">{agent.role}</p>
                </div>
              </div>

              <div className="min-h-5 text-xs text-zinc-500">
                {last ? (
                  <Link href={`/team/runs/${last.id}`} className="flex items-center gap-2 hover:text-zinc-900 dark:hover:text-zinc-100">
                    {last.status === "RUNNING" ? (
                      <LiveActivity text={last.activity ?? "Работает"} />
                    ) : (
                      <>
                        <RunStatusBadge status={last.status} />
                        <span className="truncate">{timeAgo(last.createdAt)} · {last.brief}</span>
                      </>
                    )}
                  </Link>
                ) : (
                  "Ещё не запускался"
                )}
              </div>

              <form action={runAgent} className="flex flex-1 flex-col gap-2">
                <input type="hidden" name="agent" value={agent.key} />
                <textarea name="brief" required rows={3} placeholder={agent.placeholder} className={inputCls + " flex-1 resize-none"} />
                <SubmitButton pendingText="Ставим задачу…"><Send size={14} /> Поставить задачу</SubmitButton>
              </form>

              {agent.schedule ? (
                <form action={toggleSchedule} className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-900">
                  <input type="hidden" name="agent" value={agent.key} />
                  <span className="flex items-center gap-2 text-xs text-zinc-500">
                    <CalendarClock size={14} /> {agent.schedule.label}
                  </span>
                  <button
                    role="switch"
                    aria-checked={scheduled}
                    aria-label="Работа по расписанию"
                    className={"relative h-5 w-9 rounded-full transition-colors " + (scheduled ? "bg-indigo-600" : "bg-zinc-200 dark:bg-zinc-800")}
                  >
                    <span className={"absolute top-0.5 size-4 rounded-full bg-white transition-all " + (scheduled ? "left-4.5" : "left-0.5")} />
                  </button>
                </form>
              ) : (
                <p className="flex items-center gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-400 dark:border-zinc-900">
                  <CalendarClock size={14} /> Только по запросу
                </p>
              )}
            </section>
          );
        })}
      </div>

      <Section title="Журнал работы" className="mt-8">
        {runs.length ? (
          <ul className="-my-1 divide-y divide-zinc-100 dark:divide-zinc-900">
            {runs.map((r) => (
              <li key={r.id}>
                <Link href={`/team/runs/${r.id}`} className="flex items-center gap-3 py-2.5 text-sm hover:text-zinc-900 dark:hover:text-zinc-100">
                  <AgentAvatar agent={r.agent} size="sm" />
                  <span className="w-40 shrink-0 font-medium">{AGENTS[r.agent].title}</span>
                  {r.status === "RUNNING" && r.activity ? (
                    <LiveActivity text={r.activity} className="flex-1 text-sm" />
                  ) : (
                    <span className="min-w-0 flex-1 truncate text-zinc-500">{r.brief}</span>
                  )}
                  <span className="hidden shrink-0 text-xs text-zinc-400 md:inline">{triggerLabel(r.trigger)}</span>
                  <span className="w-28 shrink-0 text-right text-xs text-zinc-400">{timeAgo(r.createdAt)}</span>
                  <span className="w-24 shrink-0 text-right"><RunStatusBadge status={r.status} /></span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Поставьте первую задачу любому агенту</Empty>
        )}
      </Section>
    </>
  );
}
