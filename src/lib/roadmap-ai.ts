import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { ROADMAP_TEMPLATE, type DraftItem } from "./roadmap-template";
import { STAGE_LABELS, STAGES, type Stage } from "./stages";

type StartupBrief = { name: string; description: string; industry: string | null; stage: Stage };
export type RoadmapDraft = DraftItem & { order: number; source: "AI" | "TEMPLATE" };

const RoadmapSchema = z.object({
  items: z.array(
    z.object({
      stage: z.enum(STAGES as [Stage, ...Stage[]]),
      title: z.string(),
      description: z.string(),
    }),
  ),
});

export function defaultClient(): OpenAI | null {
  return process.env.OPENAI_API_KEY ? new OpenAI() : null;
}

const withOrder = (items: DraftItem[], source: RoadmapDraft["source"]): RoadmapDraft[] =>
  items.map((item, i) => ({ ...item, order: i, source }));

function prompt(s: StartupBrief) {
  const stages = STAGES.map((st) => `${st} (${STAGE_LABELS[st]})`).join(", ");
  return [
    "Ты — опытный акселератор стартапов. Составь конкретный роадмап для основателя.",
    `Стадии по порядку: ${stages}. Для каждой стадии 4–6 задач.`,
    "Задачи — конкретные, проверяемые, с учётом продукта и отрасли. Названия до 80 символов, описание одно предложение. Язык — русский.",
    `Стартап: ${s.name}. Отрасль: ${s.industry ?? "не указана"}. Текущая стадия: ${s.stage}.`,
    `Описание: ${s.description}`,
  ].join("\n");
}

export async function generateRoadmap(
  startup: StartupBrief,
  client: OpenAI | null = defaultClient(),
): Promise<RoadmapDraft[]> {
  if (!client) return withOrder(ROADMAP_TEMPLATE, "TEMPLATE");
  try {
    const res = await client.chat.completions.parse({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt(startup) }],
      response_format: zodResponseFormat(RoadmapSchema, "roadmap"),
    });
    const items = res.choices[0]?.message.parsed?.items ?? [];
    if (items.length) return withOrder(items, "AI");
  } catch (err) {
    console.error("[roadmap-ai] fallback to template:", err);
  }
  return withOrder(ROADMAP_TEMPLATE, "TEMPLATE");
}
