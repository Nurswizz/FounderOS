import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeModel } from "../../../test/fake-model";
import { createStartup, resetDb } from "../../../test/db";
import { prisma } from "../prisma";
import { createRun } from "./ops";
import { executeRun } from "./runner";

vi.mock("../queue", async (original) => ({ ...(await original<object>()), enqueueRun: vi.fn() }));

beforeEach(resetDb);

describe("executeRun", () => {
  it("выполняет tools, пишет шаги и итог", async () => {
    const s = await createStartup();
    const { run } = await createRun(s.id, { agent: "MARKET_RESEARCHER", brief: "Изучи конкурентов" });
    const model = new FakeModel([
      { call: { name: "save_hub_document", args: { title: "Конкуренты", body: "## Топ-3\n- A\n- B", pinned: false } } },
      { say: "Сохранил документ «Конкуренты»." },
    ]);

    await executeRun(run.id, { model });

    const done = await prisma.agentRun.findUniqueOrThrow({ where: { id: run.id }, include: { steps: true } });
    expect(done).toMatchObject({ status: "DONE", output: "Сохранил документ «Конкуренты»." });
    expect(done.startedAt).not.toBeNull();
    expect(done.steps.map((st) => st.tool)).toEqual(["save_hub_document"]);
    expect(await prisma.hubEntry.findFirst({ where: { startupId: s.id, title: "Конкуренты" } })).not.toBeNull();

    // В первый запрос подмешан контекст стартапа и бриф.
    expect(JSON.stringify(model.requests[0].input)).toContain("Изучи конкурентов");
    expect(JSON.stringify(model.requests[0].input)).toContain("CRM для автомоек");
  });

  it("пишет живой статус по ходу работы и очищает его в конце", async () => {
    const s = await createStartup();
    const { run } = await createRun(s.id, { agent: "MARKET_RESEARCHER", brief: "Рынок" });
    const seen: (string | null)[] = [];
    const snapshot = async () => {
      // Записи статуса асинхронные (хуки SDK синхронные) — даём им долететь.
      await new Promise((r) => setTimeout(r, 100));
      seen.push((await prisma.agentRun.findUniqueOrThrow({ where: { id: run.id } })).activity);
    };

    await executeRun(run.id, {
      model: new FakeModel(
        [
          { call: { name: "save_hub_document", args: { title: "Конкуренты", body: "...", pinned: false } } },
          { say: "Готово, документ сохранён." },
        ],
        snapshot,
      ),
    });

    expect(seen[0]).toBe("Изучает задачу и контекст стартапа");
    expect(seen[1]).toBe("Думает над следующим шагом");
    const done = await prisma.agentRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(done).toMatchObject({ activity: null, draft: null, output: "Готово, документ сохранён." });
  });

  it("логирует веб-поиск (hosted tool) как шаг", async () => {
    const s = await createStartup();
    const { run } = await createRun(s.id, { agent: "MARKET_RESEARCHER", brief: "Рынок" });

    await executeRun(run.id, { model: new FakeModel([{ search: "crm автомойки", say: "Нашёл." }]) });

    const steps = await prisma.agentStep.findMany({ where: { runId: run.id } });
    expect(steps).toHaveLength(1);
    expect(steps[0].tool).toBe("web_search_call");
    expect(steps[0].input).toContain("crm автомойки");
  });

  it("без подключённого GitHub внешние действия не предлагаются", async () => {
    const s = await createStartup();
    const { run } = await createRun(s.id, { agent: "CTO", brief: "issues" });

    await executeRun(run.id, {
      model: new FakeModel([{ call: { name: "propose_github_issue", args: { title: "Онбординг", body: "DoD" } } }, { say: "ok" }]),
    });

    expect(await prisma.pendingAction.count()).toBe(0);
    const step = await prisma.agentStep.findFirstOrThrow({ where: { runId: run.id } });
    expect(step.output).toContain("GitHub не подключён");
  });

  it("вырезает маркеры цитат из итога и документов", async () => {
    const cite = "\uE200cite\uE202turn0search0\uE201";
    const s = await createStartup();
    const { run } = await createRun(s.id, { agent: "MARKET_RESEARCHER", brief: "Рынок" });

    await executeRun(run.id, {
      model: new FakeModel([
        { call: { name: "save_hub_document", args: { title: "Рынок", body: `TAM 10 млн ${cite}`, pinned: false } } },
        { say: `Готово ${cite}` },
      ]),
    });

    expect((await prisma.agentRun.findUniqueOrThrow({ where: { id: run.id } })).output).toBe("Готово");
    expect((await prisma.hubEntry.findFirstOrThrow({ where: { startupId: s.id } })).body).toBe("TAM 10 млн");
  });

  it("ошибка модели переводит запуск в FAILED", async () => {
    const s = await createStartup();
    const { run } = await createRun(s.id, { agent: "CTO", brief: "дайджест" });

    await executeRun(run.id, { model: new FakeModel([{ fail: "rate limit" }]) });

    const failed = await prisma.agentRun.findUniqueOrThrow({ where: { id: run.id } });
    expect(failed.status).toBe("FAILED");
    expect(failed.error).toContain("rate limit");
  });

  it("не перезапускает завершённый запуск", async () => {
    const s = await createStartup();
    const { run } = await createRun(s.id, { agent: "CTO", brief: "x" });
    await prisma.agentRun.update({ where: { id: run.id }, data: { status: "DONE", output: "старый" } });

    await executeRun(run.id, { model: new FakeModel([{ say: "новый" }]) });

    expect((await prisma.agentRun.findUniqueOrThrow({ where: { id: run.id } })).output).toBe("старый");
  });

  it("Chief of Staff делегирует задачу другому агенту", async () => {
    const { enqueueRun } = await import("../queue");
    const s = await createStartup();
    const { run } = await createRun(s.id, { agent: "CHIEF_OF_STAFF", brief: "недельный обзор" });

    await executeRun(run.id, {
      model: new FakeModel([
        { call: { name: "delegate_task", args: { agent: "CUSTOMER_DISCOVERY", brief: "Скрипт интервью" } } },
        { say: "Делегировал." },
      ]),
    });

    const child = await prisma.agentRun.findFirstOrThrow({ where: { parentRunId: run.id } });
    expect(child).toMatchObject({ agent: "CUSTOMER_DISCOVERY", trigger: "DELEGATED", status: "QUEUED" });
    expect(enqueueRun).toHaveBeenCalledWith(child.id);
  });
});
