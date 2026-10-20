import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CornerDownRight, ExternalLink, Wrench } from "lucide-react";
import { AgentAvatar, formatDuration, LiveActivity, RunStatusBadge, timeAgo, triggerLabel } from "@/components/agent-ui";
import { AutoRefresh } from "@/components/auto-refresh";
import { Markdown } from "@/components/markdown";
import { PendingActionRow } from "@/components/pending-action";
import { Section } from "@/components/ui";
import { AGENTS } from "@/lib/agents";
import { stepLabel, stepSummary } from "@/lib/agents/steps";
import { prisma } from "@/lib/prisma";
import { requireStartup } from "@/lib/session";

export default async function RunPage({ params }: PageProps<"/team/runs/[id]">) {
  const startup = await requireStartup();
  const { id } = await params;
  const run = await prisma.agentRun.findFirst({
    where: { id, startupId: startup.id },
    include: {
      steps: { orderBy: { createdAt: "asc" } },
      actions: { orderBy: { createdAt: "asc" } },
      children: true,
      parent: true,
    },
  });
  if (!run) notFound();

  const active = run.status === "QUEUED" || run.status === "RUNNING";
  const end = run.finishedAt ?? (active ? new Date() : null);
  const seconds = run.startedAt && end ? Math.round((end.getTime() - run.startedAt.getTime()) / 1000) : null;
  const now = run.status === "QUEUED" ? "Ждёт свободного воркера" : (run.activity ?? "Работает");

  return (
    <>
      <AutoRefresh active={active} intervalMs={1000} />
      <Link href="/team" className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft size={14} /> Команда
      </Link>

      <div className="mb-8 flex flex-wrap items-start gap-4 motion-safe:animate-fade-up">
        <AgentAvatar agent={run.agent} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{AGENTS[run.agent].title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500">
            <RunStatusBadge status={run.status} />
            <span>{triggerLabel(run.trigger)}</span>
            <span>{timeAgo(run.createdAt)}</span>
            {seconds !== null ? <span className="tabular-nums">{formatDuration(seconds)}</span> : null}
          </p>
        </div>
      </div>

      {active ? (
        <div className="mb-6 flex items-center gap-4 rounded-lg border border-indigo-200 bg-indigo-50/50 px-5 py-4 dark:border-indigo-900 dark:bg-indigo-950/30">
          <span className="text-xs font-medium tracking-wide text-indigo-600/70 uppercase">Сейчас</span>
          <LiveActivity text={now} className="text-sm font-medium" />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Section title="Задача">
            <p className="whitespace-pre-line text-sm">{run.brief}</p>
            {run.parent ? (
              <Link href={`/team/runs/${run.parent.id}`} className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                <CornerDownRight size={12} /> Поставлена агентом {AGENTS[run.parent.agent].title}
              </Link>
            ) : null}
          </Section>

          {run.output ? (
            <Section title="Результат"><Markdown>{run.output}</Markdown></Section>
          ) : null}
          {run.error ? (
            <Section title="Ошибка" className="border-red-200 dark:border-red-900">
              <p className="text-sm text-red-600">{run.error}</p>
            </Section>
          ) : null}
          {active && run.draft ? (
            <Section title="Результат · пишется">
              <Markdown>{run.draft}</Markdown>
              <span className="mt-1 inline-block h-4 w-1.5 animate-pulse bg-indigo-600 align-middle" />
            </Section>
          ) : active ? (
            <Section title="Результат">
              <div className="space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
              </div>
            </Section>
          ) : null}
        </div>

        <div className="space-y-6">
          {run.actions.length ? (
            <Section title="Действия на одобрение">
              <ul className="-my-2 divide-y divide-zinc-100 dark:divide-zinc-900">
                {run.actions.map((a) => <li key={a.id}><PendingActionRow action={a} /></li>)}
              </ul>
            </Section>
          ) : null}

          <Section title={`Ход работы · ${run.steps.length}`}>
            <ol className="relative space-y-4 border-l border-zinc-200 pl-5 dark:border-zinc-800">
              {run.steps.map((s) => {
                const summary = stepSummary(s.tool, s.input);
                return (
                  <li key={s.id} className="relative motion-safe:animate-fade-up">
                    <span className="absolute top-0.5 -left-[27px] grid size-3.5 place-items-center rounded-full bg-white ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                      <span className="size-1.5 rounded-full bg-zinc-400" />
                    </span>
                    <details className="group">
                      <summary className="cursor-pointer list-none text-sm">
                        <span className="font-medium">{stepLabel(s.tool)}</span>
                        <span className="ml-2 text-xs text-zinc-400">{s.createdAt.toLocaleTimeString("ru")}</span>
                        {summary ? <p className="mt-0.5 truncate text-xs text-zinc-500">{summary}</p> : null}
                      </summary>
                      {s.output ? (
                        <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-zinc-50 p-3 text-xs whitespace-pre-wrap text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">{s.output}</pre>
                      ) : null}
                    </details>
                  </li>
                );
              })}
              {active ? (
                <li className="relative text-sm">
                  <span className="absolute top-1 -left-[25px] size-2.5 animate-ping rounded-full bg-indigo-600" />
                  <LiveActivity text={`${now}…`} />
                </li>
              ) : null}
              {!active && !run.steps.length ? (
                <li className="flex items-center gap-2 text-sm text-zinc-400"><Wrench size={14} /> Инструменты не вызывались</li>
              ) : null}
            </ol>
          </Section>

          {run.children.length ? (
            <Section title="Поставил задачи">
              <ul className="space-y-2">
                {run.children.map((c) => (
                  <li key={c.id}>
                    <Link href={`/team/runs/${c.id}`} className="flex items-center gap-3 text-sm hover:text-zinc-900 dark:hover:text-zinc-100">
                      <AgentAvatar agent={c.agent} size="sm" />
                      <span className="min-w-0 flex-1 truncate">{c.brief}</span>
                      <RunStatusBadge status={c.status} />
                      <ExternalLink size={12} className="text-zinc-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>
      </div>
    </>
  );
}
