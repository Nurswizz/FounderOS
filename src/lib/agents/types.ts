import type { Tool } from "@openai/agents";
import type { AgentKey } from "@/generated/prisma/enums";
import type { AgentContext } from "./tools";

export type AgentDef = {
  key: AgentKey;
  title: string;
  role: string;
  placeholder: string;
  schedule: { cron: string; label: string; brief: string } | null;
  instructions: string;
  tools: Tool<AgentContext>[];
};

export const BASE_INSTRUCTIONS = `Ты — участник команды AI-агентов стартапа в платформе FounderOS. Пиши по-русски.
Сводка стартапа (стадия, следующие шаги, метрики, хаб) уже есть во входе — не запрашивай её повторно.
Работай самостоятельно: используй инструменты, не задавай вопросов основателю. Если данных не хватает — сделай разумные допущения и явно пометь их.
Результаты сохраняй в хаб документами Markdown со стабильными названиями. Закрывай задачи роадмапа, только когда результат реально получен.
Финальный ответ — краткий отчёт из 3–6 пунктов: что сделано, где лежит результат, что рекомендуешь основателю дальше.`;
