import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStartup, resetDb } from "../../../test/db";
import { createRun, proposeAction } from "./ops";
import { resolveAction } from "./pending";

beforeEach(resetDb);

async function setup() {
  const s = await createStartup();
  const { run } = await createRun(s.id, { agent: "CTO", brief: "issues" });
  const action = await proposeAction(
    { startupId: s.id, runId: run.id },
    { kind: "GITHUB_ISSUE", title: "Issue: Онбординг", payload: { title: "Онбординг", body: "DoD" } },
  );
  const create = vi.fn(async () => ({ data: { html_url: "https://github.com/acme/app/issues/1" } }));
  const access = vi.fn(async () => ({ repo: "acme/app", octokit: { rest: { issues: { create } } } }) as never);
  return { s, action, create, access };
}

describe("resolveAction", () => {
  it("одобрение выполняет действие в GitHub и сохраняет ссылку", async () => {
    const { s, action, create, access } = await setup();
    const done = await resolveAction(s.id, action.id, true, access);

    expect(create).toHaveBeenCalledWith({ owner: "acme", repo: "app", title: "Онбординг", body: "DoD" });
    expect(done).toMatchObject({ status: "APPROVED", result: "https://github.com/acme/app/issues/1" });
  });

  it("отклонение ничего не делает во внешнем сервисе", async () => {
    const { s, action, create, access } = await setup();
    expect(await resolveAction(s.id, action.id, false, access)).toMatchObject({ status: "REJECTED" });
    expect(create).not.toHaveBeenCalled();
  });

  it("повторное решение и чужой стартап игнорируются", async () => {
    const { s, action, create, access } = await setup();
    const other = await createStartup("other");

    expect(await resolveAction(other.id, action.id, true, access)).toBeNull();
    await resolveAction(s.id, action.id, true, access);
    await resolveAction(s.id, action.id, true, access);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("ошибка GitHub переводит действие в FAILED", async () => {
    const { s, action } = await setup();
    const broken = vi.fn(async () => null);
    expect(await resolveAction(s.id, action.id, true, broken)).toMatchObject({ status: "FAILED" });
  });
});
