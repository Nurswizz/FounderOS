import { STAGE_LABELS, type Stage } from "../stages";

// [завершённое действие для ленты шагов, текущее действие для живого статуса]
const LABELS: Record<string, [string, string]> = {
  list_roadmap: ["Посмотрел роадмап", "Смотрит роадмап"],
  complete_roadmap_item: ["Закрыл задачу роадмапа", "Закрывает задачу роадмапа"],
  add_roadmap_item: ["Добавил задачу в роадмап", "Добавляет задачу в роадмап"],
  list_hub: ["Просмотрел хаб", "Просматривает хаб"],
  read_hub_entry: ["Прочитал запись хаба", "Читает запись хаба"],
  save_hub_document: ["Сохранил документ", "Сохраняет документ"],
  increment_metric: ["Обновил метрику", "Обновляет метрику"],
  github_activity: ["Изучил активность GitHub", "Изучает активность GitHub"],
  sync_github_metrics: ["Синхронизировал метрики GitHub", "Синхронизирует метрики GitHub"],
  propose_github_issue: ["Предложил issue на одобрение", "Готовит issue на одобрение"],
  propose_pr_comment: ["Предложил комментарий к PR", "Готовит комментарий к PR"],
  list_recent_runs: ["Посмотрел работу команды", "Смотрит работу команды"],
  delegate_task: ["Делегировал задачу", "Делегирует задачу"],
  save_idea: ["Сохранил идею", "Сохраняет идею"],
  web_search_call: ["Искал в интернете", "Ищет в интернете"],
  web_search: ["Искал в интернете", "Ищет в интернете"],
};

export const stepLabel = (tool: string) => LABELS[tool]?.[0] ?? tool;

export function stepActivity(tool: string, input: string) {
  const label = LABELS[tool]?.[1] ?? `Работает с инструментом ${tool}`;
  const summary = stepSummary(tool, input);
  return summary ? `${label}: ${summary}` : label;
}

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
  if (typeof args.stage === "string" && args.stage in STAGE_LABELS) return STAGE_LABELS[args.stage as Stage];
  // Только человекочитаемые поля — внутренние id в ленте не показываем.
  const value = args.title ?? args.query ?? args.url ?? args.brief;
  return typeof value === "string" ? value.slice(0, 140) : null;
}

type RawEvent = { type?: string; item?: { type?: string; name?: string; action?: unknown } } | null;

// Сырые события OpenAI Responses приходят во время генерации — по ним показываем «что сейчас»,
// не дожидаясь конца ответа модели (hosted-поиск SDK отдаёт только в конце).
export function rawEventActivity(event: unknown): { activity: string; step?: { tool: string; input: string } } | null {
  const e = event as RawEvent;
  const item = e?.item;
  if (!item) return null;

  if (e.type === "response.output_item.added") {
    if (item.type === "web_search_call") return { activity: "Ищет в интернете" };
    if (item.type === "reasoning") return { activity: "Размышляет" };
    if (item.type === "function_call" && item.name) return { activity: LABELS[item.name]?.[1] ?? "Готовит действие" };
  }
  if (e.type === "response.output_item.done" && item.type === "web_search_call") {
    const input = JSON.stringify(item.action ?? {});
    return { activity: stepActivity("web_search_call", input), step: { tool: "web_search_call", input } };
  }
  return null;
}
