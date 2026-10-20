import type { AgentKey, HubKind, Prisma, RunTrigger } from "@/generated/prisma/client";
import { groupMetrics, metricLabel } from "../metrics";
import { prisma } from "../prisma";
import { computeProgress, nextSteps } from "../progress";
import { STAGE_LABELS, type Stage } from "../stages";

// Все операции принимают startupId из контекста запуска — модель его не передаёт.

export type RunScope = { startupId: string; runId: string };

export async function getOverview(startupId: string) {
  const startup = await prisma.startup.findUniqueOrThrow({
    where: { id: startupId },
    include: {
      roadmap: true,
      hub: { select: { kind: true, title: true }, orderBy: { createdAt: "desc" }, take: 30 },
      metrics: { orderBy: { capturedAt: "desc" }, take: 200 },
    },
  });
  const progress = computeProgress(startup.roadmap);
  const metrics = groupMetrics(startup.metrics);

  return [
    `# ${startup.name}`,
    `Отрасль: ${startup.industry ?? "не указана"}`,
    `Описание: ${startup.description}`,
    `Текущая стадия: ${STAGE_LABELS[progress.currentStage]} (${progress.currentStage}), роадмап выполнен на ${progress.overall}%`,
    "",
    "## Следующие шаги",
    ...nextSteps(startup.roadmap, 5).map((i) => `- [${i.id}] ${STAGE_LABELS[i.stage]}: ${i.title}`),
    "",
    "## Метрики",
    ...(metrics.length ? metrics.map((m) => `- ${metricLabel(m.key)} (${m.key}): ${m.latest}`) : ["- нет данных"]),
    "",
    "## Хаб",
    ...(startup.hub.length ? startup.hub.map((h) => `- ${h.kind}: ${h.title}`) : ["- пусто"]),
  ].join("\n");
}

/* --------------------------------- roadmap ----------------------------------- */

export function listRoadmap(startupId: string, stage?: Stage) {
  return prisma.roadmapItem.findMany({
    where: { startupId, stage },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true, stage: true, title: true, description: true, doneAt: true },
  });
}

export async function completeRoadmapItem(startupId: string, itemId: string) {
  const { count } = await prisma.roadmapItem.updateMany({
    where: { id: itemId, startupId, doneAt: null },
    data: { doneAt: new Date() },
  });
  return count > 0;
}

export async function addRoadmapItem(
  startupId: string,
  item: { stage: Stage; title: string; description?: string },
) {
  const last = await prisma.roadmapItem.aggregate({
    where: { startupId, stage: item.stage },
    _max: { order: true },
  });
  return prisma.roadmapItem.create({
    data: { ...item, startupId, source: "AI", order: (last._max.order ?? -1) + 1 },
  });
}

/* ----------------------------------- hub ------------------------------------- */

export function listHub(startupId: string) {
  return prisma.hubEntry.findMany({
    where: { startupId },
    orderBy: { createdAt: "desc" },
    select: { id: true, kind: true, title: true, url: true },
  });
}

export function readHubEntry(startupId: string, id: string) {
  return prisma.hubEntry.findFirst({ where: { id, startupId } });
}

export async function saveHubDocument(
  startupId: string,
  doc: { title: string; body: string; kind?: HubKind; pinned?: boolean },
) {
  const kind = doc.kind ?? "DOC";
  const existing = await prisma.hubEntry.findFirst({ where: { startupId, kind, title: doc.title } });
  const data = { body: doc.body, pinned: doc.pinned ?? existing?.pinned ?? false };

  return existing
    ? prisma.hubEntry.update({ where: { id: existing.id }, data })
    : prisma.hubEntry.create({ data: { ...data, startupId, kind, title: doc.title } });
}

/* --------------------------------- metrics ----------------------------------- */

export async function incrementMetric(startupId: string, key: string, delta: number) {
  const last = await prisma.metric.findFirst({ where: { startupId, key }, orderBy: { capturedAt: "desc" } });
  const value = (last?.value ?? 0) + delta;
  await prisma.metric.create({ data: { startupId, key, value } });
  return value;
}

/* ------------------------------ runs & actions ------------------------------- */

export async function createRun(
  startupId: string,
  opts: { agent: AgentKey; brief: string; trigger?: RunTrigger; parentRunId?: string },
) {
  const active = await prisma.agentRun.findFirst({
    where: { startupId, agent: opts.agent, status: { in: ["QUEUED", "RUNNING"] } },
  });
  if (active) return { run: active, created: false };

  const run = await prisma.agentRun.create({ data: { startupId, ...opts } });
  return { run, created: true };
}

export function listRecentRuns(startupId: string, limit = 10) {
  return prisma.agentRun.findMany({
    where: { startupId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { agent: true, brief: true, status: true, output: true, createdAt: true },
  });
}

export function proposeAction(
  scope: RunScope,
  action: { kind: string; title: string; payload: Prisma.InputJsonObject },
) {
  return prisma.pendingAction.create({ data: { ...action, startupId: scope.startupId, runId: scope.runId } });
}

export async function createScheduledRuns(agent: AgentKey, brief: string) {
  const settings = await prisma.agentSetting.findMany({ where: { agent, scheduleEnabled: true } });
  const runs = await Promise.all(
    settings.map((s) => createRun(s.startupId, { agent, brief, trigger: "SCHEDULE" })),
  );
  return runs.filter((r) => r.created).map((r) => r.run.id);
}
