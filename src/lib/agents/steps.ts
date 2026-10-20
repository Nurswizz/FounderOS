const LABELS: Record<string, string> = {
  list_roadmap: "Посмотрел роадмап",
  complete_roadmap_item: "Закрыл задачу роадмапа",
  add_roadmap_item: "Добавил задачу в роадмап",
  list_hub: "Просмотрел хаб",
  read_hub_entry: "Прочитал запись хаба",
  save_hub_document: "Сохранил документ",
  increment_metric: "Обновил метрику",
  github_activity: "Изучил активность GitHub",
  sync_github_metrics: "Синхронизировал метрики GitHub",
  propose_github_issue: "Предложил issue на одобрение",
  propose_pr_comment: "Предложил комментарий к PR",
  list_recent_runs: "Посмотрел работу команды",
  delegate_task: "Делегировал задачу",
  web_search_call: "Искал в интернете",
  web_search: "Искал в интернете",
};

export const stepLabel = (tool: string) => LABELS[tool] ?? tool;

// Короткая подпись шага из аргументов: название документа, запрос поиска и т.п.
export function stepSummary(tool: string, input: string): string | null {
  let args: Record<string, unknown>;
  try {
    args = JSON.parse(input);
  } catch {
    return null;
  }
  if (tool === "delegate_task") return `${args.agent}: ${args.brief}`;
  if (tool === "increment_metric") return `${args.key} +${args.delta}`;
  if (Array.isArray(args.queries)) return args.queries.join(" · ");
  const value = args.title ?? args.query ?? args.url ?? args.brief ?? Object.values(args).find((v) => typeof v === "string");
  return typeof value === "string" ? value.slice(0, 140) : null;
}
