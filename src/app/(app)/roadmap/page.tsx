import { Plus, RefreshCw } from "lucide-react";
import { addItem, regenerateRoadmap } from "@/app/actions";
import { RoadmapItemRow } from "@/components/roadmap-item";
import { SubmitButton } from "@/components/submit-button";
import { ghostCls, PageHeader, ProgressBar } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { computeProgress } from "@/lib/progress";
import { requireStartup } from "@/lib/session";
import { STAGE_LABELS, STAGES } from "@/lib/stages";

export default async function Roadmap() {
  const startup = await requireStartup();
  const items = await prisma.roadmapItem.findMany({
    where: { startupId: startup.id },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const progress = computeProgress(items);

  return (
    <>
      <PageHeader title="Роадмап" subtitle={`${progress.overall}% выполнено`}>
        <form action={regenerateRoadmap}>
          <SubmitButton className={ghostCls} pendingText="AI перестраивает роадмап…">
            <RefreshCw size={14} /> Перегенерировать
          </SubmitButton>
        </form>
      </PageHeader>

      <div className="grid gap-x-8 gap-y-10 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {STAGES.map((stage) => {
          const stageItems = items.filter((i) => i.stage === stage);
          const s = progress.byStage[stage];
          return (
            <section key={stage} className="min-w-0">
              <div className="mb-2 flex items-center gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
                <h2 className={"text-sm font-medium " + (stage === progress.currentStage ? "text-indigo-600" : "")}>
                  {STAGE_LABELS[stage]}
                </h2>
                <div className="flex-1"><ProgressBar value={s.pct} /></div>
                <span className="text-xs tabular-nums text-zinc-400">{s.done}/{s.total}</span>
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {stageItems.map((item) => <RoadmapItemRow key={item.id} item={item} removable />)}
              </ul>
              <form action={addItem} className="mt-1 flex items-center gap-2">
                <input type="hidden" name="stage" value={stage} />
                <Plus size={16} className="text-zinc-300" />
                <input name="title" required placeholder="Добавить задачу" className="w-full rounded-md bg-transparent px-1 py-2 text-sm outline-none placeholder:text-zinc-400 focus:bg-zinc-50 dark:focus:bg-zinc-900" />
              </form>
            </section>
          );
        })}
      </div>
    </>
  );
}
