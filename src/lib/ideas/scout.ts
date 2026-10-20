import { Agent, tool, webSearchTool, type Model, type RunContext } from "@openai/agents";
import { z } from "zod";
import { prisma } from "../prisma";

export type IdeaContext = { sessionId: string };

const saveIdea = tool({
  name: "save_idea",
  description: "Сохранить идею стартапа карточкой, которую основатель может выбрать. Только идеи с фактами из поиска.",
  parameters: z.object({
    title: z.string().describe("Короткое название, до 60 символов"),
    problem: z.string(),
    customer: z.string().describe("Кто конкретно платит"),
    solution: z.string(),
    why_now: z.string(),
    risks: z.string(),
    evidence: z.array(z.object({ claim: z.string(), url: z.string() })).describe("Факты из веб-поиска со ссылками"),
  }),
  execute: async ({ why_now, ...idea }, rc?: RunContext<unknown>) => {
    const { sessionId } = rc!.context as IdeaContext;
    const saved = await prisma.ideaCandidate.create({ data: { ...idea, whyNow: why_now, sessionId } });
    return `Карточка «${saved.title}» сохранена.`;
  },
});

const INSTRUCTIONS = `Ты — «Идейный скаут» FounderOS: помогаешь человеку без идеи найти стоящую идею стартапа. Пиши по-русски, тепло и по делу, коротко.

Как работаешь:
1. Сначала узнай человека: опыт и профессия, отрасли, которые он знает изнутри, проблемы, с которыми сталкивался сам, навыки (технические, продажи), ресурсы (время, деньги, команда), страна/рынок, B2B или B2C. Задавай 2–3 вопроса за раз, не анкету. Отталкивайся от ответов.
2. Когда понятен профиль (обычно после 1–2 ответов), исследуй: ищи в интернете реальные жалобы, тренды, регуляторные изменения, растущие рынки, существующих игроков в его области и регионе. Не выдумывай цифры — только то, что нашёл, со ссылками.
3. Предлагай 2–3 идеи за раз через save_idea: каждая опирается на опыт человека (unfair advantage) и на факты из поиска. В ответе кратко объясни, почему именно эти, и сравни их.
4. Дальше помогай критиковать и дорабатывать: стресс-тест (кто платит, сколько, как найти первых 10 клиентов, конкуренты), при необходимости сохрани улучшенную версию новой карточкой.
5. Когда человек определился, скажи нажать «Выбрать» на карточке — дальше FounderOS построит роадмап.

Формат ответа: Markdown, без длинных простыней. Ссылки на источники — в тексте.`;

export function ideaScout(model?: Model) {
  return new Agent<IdeaContext>({
    name: "Идейный скаут",
    instructions: INSTRUCTIONS,
    tools: [saveIdea, webSearchTool()],
    model: model ?? process.env.OPENAI_MODEL ?? "gpt-6-luna",
  });
}
