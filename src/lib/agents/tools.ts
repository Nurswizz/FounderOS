import { tool, type RunContext } from "@openai/agents";
import { z } from "zod";
import { INTEGRATIONS } from "../integrations";
import { githubAccess, repoActivity } from "../integrations/github";
import { prisma } from "../prisma";
import { STAGES, type Stage } from "../stages";
import {
  addRoadmapItem,
  completeRoadmapItem,
  createRun,
  incrementMetric,
  listHub,
  listRecentRuns,
  listRoadmap,
  proposeAction,
  readHubEntry,
  saveHubDocument,
  type RunScope,
} from "./ops";
import { enqueueRun } from "../queue";

export type AgentContext = RunScope;

const scope = (rc?: RunContext<unknown>) => {
  if (!rc) throw new Error("Run context is missing");
  return rc.context as AgentContext;
};

const stageSchema = z.enum(STAGES as [Stage, ...Stage[]]);

/* ------------------------------- общие ---------------------------------------- */

const listRoadmapTool = tool({
  name: "list_roadmap",
  description: "Задачи роадмапа (id, стадия, название, выполнена ли). Можно отфильтровать по стадии.",
  parameters: z.object({ stage: stageSchema.nullable() }),
  execute: async ({ stage }, rc) => listRoadmap(scope(rc).startupId, stage ?? undefined),
});

const completeRoadmapItemTool = tool({
  name: "complete_roadmap_item",
  description: "Отметить задачу роадмапа выполненной. Только если результат реально получен и сохранён.",
  parameters: z.object({ item_id: z.string() }),
  execute: async ({ item_id }, rc) =>
    (await completeRoadmapItem(scope(rc).startupId, item_id)) ? "Задача отмечена." : "Задача не найдена или уже выполнена.",
});

const addRoadmapItemTool = tool({
  name: "add_roadmap_item",
  description: "Добавить задачу в роадмап, если её не хватает.",
  parameters: z.object({ stage: stageSchema, title: z.string(), description: z.string() }),
  execute: async (item, rc) => {
    const created = await addRoadmapItem(scope(rc).startupId, item);
    return `Добавлена задача ${created.id}.`;
  },
});

const listHubTool = tool({
  name: "list_hub",
  description: "Список записей хаба: id, тип, название, ссылка.",
  parameters: z.object({}),
  execute: async (_, rc) => listHub(scope(rc).startupId),
});

const readHubEntryTool = tool({
  name: "read_hub_entry",
  description: "Прочитать запись хаба целиком по id (например, прошлую версию отчёта).",
  parameters: z.object({ id: z.string() }),
  execute: async ({ id }, rc) => (await readHubEntry(scope(rc).startupId, id)) ?? "Запись не найдена.",
});

const saveHubDocumentTool = tool({
  name: "save_hub_document",
  description:
    "Сохранить документ в хаб в формате Markdown. Документ с тем же названием перезаписывается — используй стабильные названия.",
  parameters: z.object({ title: z.string(), body: z.string(), pinned: z.boolean() }),
  execute: async (doc, rc) => {
    const saved = await saveHubDocument(scope(rc).startupId, doc);
    return `Документ «${saved.title}» сохранён (id ${saved.id}).`;
  },
});

export const COMMON_TOOLS = [
  listRoadmapTool,
  completeRoadmapItemTool,
  addRoadmapItemTool,
  listHubTool,
  readHubEntryTool,
  saveHubDocumentTool,
];

/* -------------------------------- метрики ------------------------------------- */

export const incrementMetricTool = tool({
  name: "increment_metric",
  description: "Увеличить счётчик-метрику (например interviews) на delta. Возвращает новое значение.",
  parameters: z.object({ key: z.string(), delta: z.number() }),
  execute: async ({ key, delta }, rc) => `Новое значение ${key}: ${await incrementMetric(scope(rc).startupId, key, delta)}`,
});

/* -------------------------------- GitHub -------------------------------------- */

const NO_GITHUB = "GitHub не подключён: попроси основателя выбрать репозиторий в «Интеграциях».";

export const githubActivityTool = tool({
  name: "github_activity",
  description: "Активность подключённого репозитория: коммиты за 7 дней, открытые PR (возраст), открытые issues (дни без движения).",
  parameters: z.object({}),
  execute: async (_, rc) => {
    const gh = await githubAccess(scope(rc).startupId);
    return gh ? repoActivity(gh.octokit, gh.repo) : NO_GITHUB;
  },
});

export const syncGithubMetricsTool = tool({
  name: "sync_github_metrics",
  description: "Обновить метрики GitHub на дашборде (коммиты, issues, звёзды).",
  parameters: z.object({}),
  execute: async (_, rc) => {
    const { startupId } = scope(rc);
    const gh = await githubAccess(startupId);
    if (!gh) return NO_GITHUB;
    const metrics = await INTEGRATIONS.GITHUB(gh.token, { repo: gh.repo });
    await prisma.metric.createMany({ data: metrics.map((m) => ({ ...m, startupId, source: "GITHUB" as const })) });
    return metrics;
  },
});

export const proposeGithubIssueTool = tool({
  name: "propose_github_issue",
  description: "Предложить создать issue в репозитории. Issue появится только после одобрения основателем.",
  parameters: z.object({ title: z.string(), body: z.string() }),
  execute: async ({ title, body }, rc) => {
    if (!(await githubAccess(scope(rc).startupId))) return NO_GITHUB;
    const action = await proposeAction(scope(rc), { kind: "GITHUB_ISSUE", title: `Issue: ${title}`, payload: { title, body } });
    return `Отправлено на одобрение (${action.id}).`;
  },
});

export const proposePrCommentTool = tool({
  name: "propose_pr_comment",
  description: "Предложить комментарий к PR. Будет опубликован только после одобрения основателем.",
  parameters: z.object({ pr_number: z.number().int(), body: z.string() }),
  execute: async ({ pr_number, body }, rc) => {
    if (!(await githubAccess(scope(rc).startupId))) return NO_GITHUB;
    const action = await proposeAction(scope(rc), {
      kind: "GITHUB_PR_COMMENT",
      title: `Комментарий к PR #${pr_number}`,
      payload: { number: pr_number, body },
    });
    return `Отправлено на одобрение (${action.id}).`;
  },
});

/* ------------------------------ оркестрация ----------------------------------- */

export const listRecentRunsTool = tool({
  name: "list_recent_runs",
  description: "Последние запуски агентов команды: кто, что делал, статус и итог.",
  parameters: z.object({}),
  execute: async (_, rc) => listRecentRuns(scope(rc).startupId, 15),
});

export const delegateTaskTool = tool({
  name: "delegate_task",
  description:
    "Поставить задачу другому агенту. MARKET_RESEARCHER — рынок и конкуренты, CUSTOMER_DISCOVERY — интервью и гипотезы, CTO — разработка и GitHub.",
  parameters: z.object({ agent: z.enum(["MARKET_RESEARCHER", "CUSTOMER_DISCOVERY", "CTO"]), brief: z.string() }),
  execute: async ({ agent, brief }, rc) => {
    const { startupId, runId } = scope(rc);
    const { run, created } = await createRun(startupId, { agent, brief, trigger: "DELEGATED", parentRunId: runId });
    if (!created) return `У ${agent} уже есть активная задача: «${run.brief}». Новую не ставлю.`;
    await enqueueRun(run.id);
    return `Задача поставлена ${agent} (${run.id}).`;
  },
});
