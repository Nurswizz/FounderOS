import { STAGES, stageIndex, type Stage } from "./stages";

type Item = { stage: Stage; doneAt: Date | null; order?: number };
type StageProgress = { done: number; total: number; pct: number };

const pct = (done: number, total: number) => (total ? Math.round((done / total) * 100) : 0);

export function computeProgress(items: readonly Item[]) {
  const byStage = Object.fromEntries(
    STAGES.map((stage) => {
      const inStage = items.filter((i) => i.stage === stage);
      const done = inStage.filter((i) => i.doneAt).length;
      return [stage, { done, total: inStage.length, pct: pct(done, inStage.length) }];
    }),
  ) as Record<Stage, StageProgress>;

  const doneTotal = items.filter((i) => i.doneAt).length;
  const firstOpen = STAGES.find((s) => byStage[s].done < byStage[s].total);

  return {
    overall: pct(doneTotal, items.length),
    byStage,
    currentStage: firstOpen ?? (items.length ? STAGES[STAGES.length - 1] : STAGES[0]),
  };
}

export function nextSteps<T extends Item>(items: readonly T[], limit = 3): T[] {
  return items
    .filter((i) => !i.doneAt)
    .sort((a, b) => stageIndex(a.stage) - stageIndex(b.stage) || (a.order ?? 0) - (b.order ?? 0))
    .slice(0, limit);
}
