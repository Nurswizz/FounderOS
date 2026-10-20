import { Stage } from "@/generated/prisma/enums";

export { Stage };

export const STAGES = Object.values(Stage);

export const STAGE_LABELS: Record<Stage, string> = {
  IDEA: "Идея",
  VALIDATION: "Валидация",
  MVP: "MVP",
  LAUNCH: "Запуск",
  GROWTH: "Рост",
};

export const stageIndex = (stage: Stage) => STAGES.indexOf(stage);
