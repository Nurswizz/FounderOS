import { STAGES, type Stage } from "./stages";

export const CHECKPOINTS = [
  { key: "problemDefined", label: "Сформулирована проблема и целевой клиент" },
  { key: "problemValidated", label: "Проблема подтверждена интервью с клиентами" },
  { key: "productBuilt", label: "Есть работающий MVP" },
  { key: "launched", label: "Продукт запущен, есть пользователи" },
] as const;

export type Answers = Record<(typeof CHECKPOINTS)[number]["key"], boolean>;

// Стадия = следующая после последнего пройденного подряд чекпоинта.
export function detectStage(answers: Answers): Stage {
  const passed = CHECKPOINTS.findIndex((c) => !answers[c.key]);
  return STAGES[passed === -1 ? CHECKPOINTS.length : passed];
}
