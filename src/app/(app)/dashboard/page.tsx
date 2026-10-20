import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HubEntryRow } from "@/components/hub-entry";
import { RoadmapItemRow } from "@/components/roadmap-item";
import { Sparkline } from "@/components/sparkline";
import { Empty, PageHeader, ProgressBar, Section } from "@/components/ui";
import { groupMetrics, metricLabel } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { computeProgress, nextSteps } from "@/lib/progress";
import { requireStartup } from "@/lib/session";
import { STAGE_LABELS, STAGES } from "@/lib/stages";

const more = (href: string) => (
  <Link href={href} className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" aria-label="Открыть">
    <ArrowRight size={16} />
  </Link>
);

export default async function Dashboard() {
  const startup = await requireStartup();
  const [items, pinned, metrics] = await Promise.all([
    prisma.roadmapItem.findMany({ where: { startupId: startup.id } }),
    prisma.hubEntry.findMany({ where: { startupId: startup.id, pinned: true }, orderBy: { createdAt: "desc" } }),
    prisma.metric.findMany({ where: { startupId: startup.id }, orderBy: { capturedAt: "desc" }, take: 200 }),
  ]);
  const progress = computeProgress(items);

  return (
    <>
      <PageHeader
        title={`Стадия: ${STAGE_LABELS[progress.currentStage]}`}
        subtitle={`Роадмап выполнен на ${progress.overall}%`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Прогресс по стадиям" action={more("/roadmap")}>
          <ul className="space-y-3">
            {STAGES.map((stage) => {
              const s = progress.byStage[stage];
              return (
                <li key={stage} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className={stage === progress.currentStage ? "font-medium" : "text-zinc-500"}>
                      {STAGE_LABELS[stage]}
                    </span>
                    <span className="tabular-nums text-zinc-400">{s.done}/{s.total}</span>
                  </div>
                  <ProgressBar value={s.pct} />
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title="Следующие шаги" action={more("/roadmap")}>
          {items.length ? (
            <ul className="-my-2">
              {nextSteps(items).map((item) => <RoadmapItemRow key={item.id} item={item} />)}
            </ul>
          ) : (
            <Empty>Роадмап пуст</Empty>
          )}
        </Section>

        <Section title="Метрики" action={more("/metrics")}>
          {metrics.length ? (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {groupMetrics(metrics).map((m) => (
                <li key={m.key} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-zinc-500">{metricLabel(m.key)}</span>
                  <span className="flex items-center gap-4">
                    <Sparkline values={m.values.slice(-12)} />
                    <span className="w-16 text-right font-medium tabular-nums">{m.latest.toLocaleString("ru")}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Добавьте метрику или подключите GitHub</Empty>
          )}
        </Section>

        <Section title="Закреплено" action={more("/hub")}>
          {pinned.length ? (
            <ul className="-my-2.5">
              {pinned.map((e) => <HubEntryRow key={e.id} entry={e} actions={false} />)}
            </ul>
          ) : (
            <Empty>Закрепите важное в хабе</Empty>
          )}
        </Section>
      </div>
    </>
  );
}
