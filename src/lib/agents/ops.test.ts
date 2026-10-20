import { beforeEach, describe, expect, it } from "vitest";
import { createStartup, resetDb } from "../../../test/db";
import { prisma } from "../prisma";
import {
  addRoadmapItem,
  completeRoadmapItem,
  createRun,
  createScheduledRuns,
  getOverview,
  incrementMetric,
  proposeAction,
  saveHubDocument,
} from "./ops";

beforeEach(resetDb);

describe("roadmap ops", () => {
  it("закрывают только задачи своего стартапа", async () => {
    const [a, b] = [await createStartup("a"), await createStartup("b")];
    const foreign = await addRoadmapItem(b.id, { stage: "IDEA", title: "Чужая" });

    expect(await completeRoadmapItem(a.id, foreign.id)).toBe(false);
    expect((await prisma.roadmapItem.findUnique({ where: { id: foreign.id } }))?.doneAt).toBeNull();

    const own = await addRoadmapItem(a.id, { stage: "IDEA", title: "Своя" });
    expect(await completeRoadmapItem(a.id, own.id)).toBe(true);
  });
});

describe("saveHubDocument", () => {
  it("обновляет документ с тем же названием вместо дубля", async () => {
    const s = await createStartup();
    await saveHubDocument(s.id, { title: "Конкуренты", body: "v1" });
    await saveHubDocument(s.id, { title: "Конкуренты", body: "v2" });

    const docs = await prisma.hubEntry.findMany({ where: { startupId: s.id } });
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ kind: "DOC", body: "v2" });
  });
});

describe("incrementMetric", () => {
  it("прибавляет к последнему значению, начиная с нуля", async () => {
    const s = await createStartup();
    expect(await incrementMetric(s.id, "interviews", 1)).toBe(1);
    expect(await incrementMetric(s.id, "interviews", 2)).toBe(3);
  });
});

describe("createRun", () => {
  it("не создаёт второй активный запуск того же агента", async () => {
    const s = await createStartup();
    const first = await createRun(s.id, { agent: "CTO", brief: "дайджест" });
    const second = await createRun(s.id, { agent: "CTO", brief: "ещё раз" });

    expect(first.created).toBe(true);
    expect(second).toMatchObject({ created: false, run: { id: first.run.id } });

    await prisma.agentRun.update({ where: { id: first.run.id }, data: { status: "DONE" } });
    expect((await createRun(s.id, { agent: "CTO", brief: "снова" })).created).toBe(true);
  });
});

describe("proposeAction", () => {
  it("создаёт действие в очереди одобрения", async () => {
    const s = await createStartup();
    const { run } = await createRun(s.id, { agent: "CTO", brief: "issues" });
    const action = await proposeAction(
      { startupId: s.id, runId: run.id },
      { kind: "GITHUB_ISSUE", title: "Issue: Онбординг", payload: { title: "Онбординг", body: "..." } },
    );
    expect(action.status).toBe("PENDING");
  });
});

describe("getOverview", () => {
  it("собирает контекст стартапа для агента", async () => {
    const s = await createStartup();
    await addRoadmapItem(s.id, { stage: "VALIDATION", title: "15 интервью" });
    const text = await getOverview(s.id);

    expect(text).toContain("Acme");
    expect(text).toContain("15 интервью");
  });
});

describe("createScheduledRuns", () => {
  it("создаёт запуски только там, где расписание включено", async () => {
    const [on, off] = [await createStartup("on"), await createStartup("off")];
    await prisma.agentSetting.create({ data: { startupId: on.id, agent: "CTO", scheduleEnabled: true } });
    await prisma.agentSetting.create({ data: { startupId: off.id, agent: "CTO", scheduleEnabled: false } });

    const ids = await createScheduledRuns("CTO", "Дайджест");
    const runs = await prisma.agentRun.findMany();

    expect(ids).toHaveLength(1);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({ startupId: on.id, trigger: "SCHEDULE", brief: "Дайджест" });
  });
});
