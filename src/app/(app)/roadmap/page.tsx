import { Plus, RefreshCw } from "lucide-react";
import { addItem, regenerateRoadmap } from "@/app/actions";
import { RoadmapItemRow } from "@/components/roadmap-item";
import { ghostCls, inputCls, PageHeader, ProgressBar } from "@/components/ui";
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
          <button className={ghostCls} title="Заменить незавершённые задачи с текущей стадии">
            <RefreshCw size={14} /> Перегенерировать
          </button>
        </form>
      </PageHeader>

      <div className="space-y-10">
        {STAGES.map((stage) => {
          const stageItems = items.filter((i) => i.stage === stage);
          const s = progress.byStage[stage];
          return (
            <section key={stage}>
              <div className="mb-2 flex items-center gap-4">
                <h2 className={"text-sm font-medium " + (stage === progress.currentStage ? "text-indigo-600" : "")}>
                  {STAGE_LABELS[stage]}
                </h2>
                <div className="w-32"><ProgressBar value={s.pct} /></div>
                <span className="text-xs tabular-nums text-zinc-400">{s.done}/{s.total}</span>
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {stageItems.map((item) => <RoadmapItemRow key={item.id} item={item} removable />)}
              </ul>
              <form action={addItem} className="mt-1 flex items-center gap-2">
                <input type="hidden" name="stage" value={stage} />
                <Plus size={16} className="text-zinc-300" />
                <input name="title" required placeholder="Добавить задачу" className={inputCls + " border-transparent px-1"} />
              </form>
            </section>
          );
        })}
      </div>
    </>
  );
}
