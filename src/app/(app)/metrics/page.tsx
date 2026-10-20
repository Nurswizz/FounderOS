import { Plus } from "lucide-react";
import { siGithub } from "simple-icons";
import { addMetric } from "@/app/actions";
import { BrandIcon } from "@/components/brand-icon";
import { Sparkline } from "@/components/sparkline";
import { SubmitButton } from "@/components/submit-button";
import { Empty, inputCls, PageHeader } from "@/components/ui";
import { groupMetrics, METRIC_LABELS, metricLabel } from "@/lib/metrics";
import { prisma } from "@/lib/prisma";
import { requireStartup } from "@/lib/session";

export default async function Metrics() {
  const startup = await requireStartup();
  const metrics = await prisma.metric.findMany({
    where: { startupId: startup.id },
    orderBy: { capturedAt: "desc" },
    take: 500,
  });
  const groups = groupMetrics(metrics);
  const githubKeys = new Set(metrics.filter((m) => m.source === "GITHUB").map((m) => m.key));

  return (
    <>
      <PageHeader title="Метрики" subtitle="Ручной ввод и данные интеграций" />

      <form action={addMetric} className="mb-8 flex flex-wrap gap-2">
        <input name="key" required list="metric-keys" placeholder="Метрика (mrr, users...)" className={inputCls + " max-w-56"} />
        <datalist id="metric-keys">
          {Object.keys(METRIC_LABELS).map((k) => <option key={k} value={k}>{METRIC_LABELS[k]}</option>)}
        </datalist>
        <input name="value" required inputMode="decimal" placeholder="Значение" className={inputCls + " max-w-36"} />
        <SubmitButton pendingText="Сохраняем…"><Plus size={16} /> Записать</SubmitButton>
      </form>

      {groups.length ? (
        <table className="w-full text-sm motion-safe:animate-fade-up">
          <thead className="text-left text-xs text-zinc-400">
            <tr>
              <th className="pb-2 font-normal">Метрика</th>
              <th className="pb-2 font-normal">Динамика</th>
              <th className="pb-2 text-right font-normal">Значение</th>
              <th className="pb-2 text-right font-normal">Обновлено</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {groups.map((g) => (
              <tr key={g.key}>
                <td className="py-2.5">
                  <span className="flex items-center gap-2">
                    {githubKeys.has(g.key) ? <BrandIcon icon={siGithub} size={14} /> : null}
                    {metricLabel(g.key)}
                  </span>
                </td>
                <td className="py-2.5"><Sparkline values={g.values.slice(-30)} width={200} /></td>
                <td className="py-2.5 text-right font-medium tabular-nums">{g.latest.toLocaleString("ru")}</td>
                <td className="py-2.5 text-right text-zinc-400">{g.at.toLocaleDateString("ru")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <Empty>Метрик пока нет</Empty>
      )}
    </>
  );
}
