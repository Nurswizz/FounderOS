type Point = { key: string; value: number; capturedAt: Date };

export const METRIC_LABELS: Record<string, string> = {
  mrr: "MRR",
  users: "Пользователи",
  commits_7d: "Коммиты за 7 дней",
  open_issues: "Открытые issues",
  stars: "Звёзды GitHub",
};

export const metricLabel = (key: string) => METRIC_LABELS[key] ?? key;

export function groupMetrics(points: Point[]) {
  const sorted = [...points].sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
  const byKey = Map.groupBy(sorted, (p) => p.key);
  return [...byKey]
    .map(([key, pts]) => ({ key, values: pts.map((p) => p.value), latest: pts.at(-1)!.value, at: pts.at(-1)!.capturedAt }))
    .sort((a, b) => a.key.localeCompare(b.key));
}
