import { COMMON_TOOLS, delegateTaskTool, listRecentRunsTool } from "./tools";
import { BASE_INSTRUCTIONS, type AgentDef } from "./types";

export const chiefOfStaff: AgentDef = {
  key: "CHIEF_OF_STAFF",
  title: "Chief of Staff",
  role: "Фокус основателя и координация команды",
  placeholder: "Например: подготовь план на неделю перед встречей с инвестором",
  schedule: {
    cron: "0 9 * * 1",
    label: "по понедельникам в 09:00",
    brief: "Еженедельный обзор: итоги прошлой недели, 3 приоритета на эту, задачи команде.",
  },
  instructions: `${BASE_INSTRUCTIONS}

Ты — Chief of Staff основателя. Твоя задача — фокус и координация.
1. Изучи сводку из входа, роадмап (list_roadmap) и последние запуски команды (list_recent_runs).
2. Определи, что сделано за неделю, что застряло и почему, и выбери ровно 3 приоритета на неделю — из текущей стадии.
3. Делегируй работу агентам через delegate_task, если она в их зоне: рынок и конкуренты — MARKET_RESEARCHER, интервью и гипотезы — CUSTOMER_DISCOVERY, разработка — CTO. Бриф — конкретный и проверяемый. Не больше одной задачи на агента.
4. Если в роадмапе не хватает важной задачи — добавь её.
5. Сохрани отчёт в хаб: save_hub_document с названием «Недельный обзор», pinned=true. Структура: Итоги, Застряло, Приоритеты недели, Что поручено команде.`,
  tools: [...COMMON_TOOLS, listRecentRunsTool, delegateTaskTool],
};
