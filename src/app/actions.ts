"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { AgentKey, HubKind, Provider } from "@/generated/prisma/enums";
import { createRun } from "@/lib/agents/ops";
import { resolveAction } from "@/lib/agents/pending";
import { enqueueRun } from "@/lib/queue";
import { INTEGRATIONS } from "@/lib/integrations";
import { CHECKPOINTS, detectStage } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { computeProgress } from "@/lib/progress";
import { generateRoadmap } from "@/lib/roadmap-ai";
import { githubToken, requireStartup, requireUserId } from "@/lib/session";
import { STAGES, stageIndex, type Stage } from "@/lib/stages";

function str(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function optionalStr(form: FormData, key: string) {
  const v = str(form, key);
  return v.length > 0 ? v : null;
}

const isStage = (v: string): v is Stage => (STAGES as string[]).includes(v);

function safeUrl(v: string | null) {
  if (!v) return null;
  try {
    const u = new URL(v.includes("://") ? v : `https://${v}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/* ----------------------------------- auth ------------------------------------ */

export async function signInWithGithub() {
  await signIn("github", { redirectTo: "/dashboard" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

/* -------------------------------- onboarding --------------------------------- */

export async function createStartup(form: FormData) {
  const userId = await requireUserId();
  const name = str(form, "name");
  const description = str(form, "description");
  if (!name || !description) return;

  const stage = detectStage(
    Object.fromEntries(CHECKPOINTS.map((c) => [c.key, form.get(c.key) === "on"])) as never,
  );
  const industry = optionalStr(form, "industry");
  const drafts = await generateRoadmap({ name, description, industry, stage });
  const now = new Date();

  await prisma.startup.create({
    data: {
      userId,
      name,
      description,
      industry,
      stage,
      roadmap: {
        create: drafts.map((d) => ({
          ...d,
          doneAt: stageIndex(d.stage) < stageIndex(stage) ? now : null,
        })),
      },
    },
  });

  redirect("/dashboard");
}

/* --------------------------------- roadmap ----------------------------------- */

export async function toggleItem(form: FormData) {
  const startup = await requireStartup();
  const item = await prisma.roadmapItem.findFirst({
    where: { id: str(form, "id"), startupId: startup.id },
  });
  if (!item) return;

  await prisma.roadmapItem.update({
    where: { id: item.id },
    data: { doneAt: item.doneAt ? null : new Date() },
  });
  revalidatePath("/", "layout");
}

export async function addItem(form: FormData) {
  const startup = await requireStartup();
  const stage = str(form, "stage");
  const title = str(form, "title");
  if (!title || !isStage(stage)) return;

  const last = await prisma.roadmapItem.aggregate({
    where: { startupId: startup.id, stage },
    _max: { order: true },
  });
  await prisma.roadmapItem.create({
    data: { startupId: startup.id, stage, title, source: "CUSTOM", order: (last._max.order ?? -1) + 1 },
  });
  revalidatePath("/roadmap");
}

export async function deleteItem(form: FormData) {
  const startup = await requireStartup();
  await prisma.roadmapItem.deleteMany({ where: { id: str(form, "id"), startupId: startup.id } });
  revalidatePath("/", "layout");
}

// Перегенерирует только незавершённые не-кастомные задачи начиная с текущей стадии.
export async function regenerateRoadmap() {
  const startup = await requireStartup();
  const items = await prisma.roadmapItem.findMany({ where: { startupId: startup.id } });
  const { currentStage } = computeProgress(items);
  const drafts = await generateRoadmap({ ...startup, stage: currentStage });

  await prisma.$transaction([
    prisma.roadmapItem.deleteMany({
      where: { startupId: startup.id, doneAt: null, source: { not: "CUSTOM" } },
    }),
    prisma.roadmapItem.createMany({
      data: drafts
        .filter((d) => stageIndex(d.stage) >= stageIndex(currentStage))
        .map((d) => ({ ...d, startupId: startup.id })),
    }),
  ]);
  revalidatePath("/", "layout");
}

/* ----------------------------------- hub ------------------------------------- */

export async function createHubEntry(form: FormData) {
  const startup = await requireStartup();
  const title = str(form, "title");
  const kind = str(form, "kind");
  if (!title || !(kind in HubKind)) return;

  await prisma.hubEntry.create({
    data: {
      startupId: startup.id,
      kind: kind as HubKind,
      title,
      url: safeUrl(optionalStr(form, "url")),
      body: optionalStr(form, "body"),
    },
  });
  revalidatePath("/", "layout");
}

export async function toggleHubPin(form: FormData) {
  const startup = await requireStartup();
  const entry = await prisma.hubEntry.findFirst({
    where: { id: str(form, "id"), startupId: startup.id },
  });
  if (!entry) return;

  await prisma.hubEntry.update({ where: { id: entry.id }, data: { pinned: !entry.pinned } });
  revalidatePath("/", "layout");
}

export async function deleteHubEntry(form: FormData) {
  const startup = await requireStartup();
  await prisma.hubEntry.deleteMany({ where: { id: str(form, "id"), startupId: startup.id } });
  revalidatePath("/", "layout");
}

/* --------------------------------- metrics ----------------------------------- */

export async function addMetric(form: FormData) {
  const startup = await requireStartup();
  const key = str(form, "key").toLowerCase().replace(/\s+/g, "_");
  const value = Number(str(form, "value").replace(",", "."));
  if (!key || !Number.isFinite(value)) return;

  await prisma.metric.create({ data: { startupId: startup.id, key, value } });
  revalidatePath("/", "layout");
}

/* ------------------------------- integrations -------------------------------- */

export async function connectGithub(form: FormData) {
  const startup = await requireStartup();
  const repo = str(form, "repo");
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) return;

  await prisma.integration.upsert({
    where: { startupId_provider: { startupId: startup.id, provider: "GITHUB" } },
    create: { startupId: startup.id, provider: "GITHUB", config: { repo } },
    update: { config: { repo } },
  });
  await syncIntegration(form);
}

export async function syncIntegration(form: FormData) {
  const startup = await requireStartup();
  const provider = (str(form, "provider") || "GITHUB") as Provider;
  const integration = await prisma.integration.findUnique({
    where: { startupId_provider: { startupId: startup.id, provider } },
  });
  const token = await githubToken(startup.userId);
  if (!integration || !token) redirect("/settings/integrations?error=token");

  let failed = false;
  try {
    const metrics = await INTEGRATIONS[provider](token, integration.config as Record<string, string>);
    const capturedAt = new Date();
    await prisma.$transaction([
      prisma.metric.createMany({
        data: metrics.map((m) => ({ ...m, startupId: startup.id, source: provider, capturedAt })),
      }),
      prisma.integration.update({ where: { id: integration.id }, data: { lastSyncedAt: capturedAt } }),
    ]);
  } catch (err) {
    console.error(`[sync:${provider}]`, err);
    failed = true;
  }

  revalidatePath("/", "layout");
  if (failed) redirect("/settings/integrations?error=sync");
}

export async function disconnectIntegration(form: FormData) {
  const startup = await requireStartup();
  await prisma.integration.deleteMany({
    where: { startupId: startup.id, provider: str(form, "provider") as Provider },
  });
  revalidatePath("/settings/integrations");
}

/* ---------------------------------- team ------------------------------------- */

export async function runAgent(form: FormData) {
  const startup = await requireStartup();
  const agent = str(form, "agent");
  const brief = str(form, "brief");
  if (!(agent in AgentKey) || !brief) return;

  const { run, created } = await createRun(startup.id, { agent: agent as AgentKey, brief });
  if (created) await enqueueRun(run.id);
  redirect(`/team/runs/${run.id}`);
}

export async function toggleSchedule(form: FormData) {
  const startup = await requireStartup();
  const agent = str(form, "agent");
  if (!(agent in AgentKey)) return;

  const key = { startupId: startup.id, agent: agent as AgentKey };
  const current = await prisma.agentSetting.findUnique({ where: { startupId_agent: key } });
  await prisma.agentSetting.upsert({
    where: { startupId_agent: key },
    create: { ...key, scheduleEnabled: true },
    update: { scheduleEnabled: !current?.scheduleEnabled },
  });
  revalidatePath("/team");
}

export async function resolvePendingAction(form: FormData) {
  const startup = await requireStartup();
  await resolveAction(startup.id, str(form, "id"), str(form, "decision") === "approve");
  revalidatePath("/", "layout");
}

