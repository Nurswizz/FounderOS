import { describe, expect, it, vi } from "vitest";
import { repoActivity, syncGithub } from "./github";

function fakeOctokit() {
  return {
    rest: {
      repos: {
        get: vi.fn(async () => ({ data: { open_issues_count: 7, stargazers_count: 42 } })),
        listCommits: vi.fn(),
      },
    },
    paginate: vi.fn(async () => [{}, {}, {}]),
  };
}

describe("syncGithub", () => {
  it("собирает метрики репозитория", async () => {
    const octokit = fakeOctokit();
    const metrics = await syncGithub(octokit as never, "acme/app");

    expect(metrics).toEqual([
      { key: "commits_7d", value: 3 },
      { key: "open_issues", value: 7 },
      { key: "stars", value: 42 },
    ]);
    expect(octokit.rest.repos.get).toHaveBeenCalledWith({ owner: "acme", repo: "app" });
  });

  it("невалидное имя репо — ошибка", async () => {
    await expect(syncGithub(fakeOctokit() as never, "acme")).rejects.toThrow();
  });
});

describe("repoActivity", () => {
  it("отделяет PR от issues и считает возраст", async () => {
    const old = new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString();
    const octokit = {
      rest: { repos: { listCommits: "commits" }, pulls: { list: "pulls" }, issues: { listForRepo: "issues" } },
      paginate: vi.fn(async (fn: string) =>
        ({
          commits: [{ commit: { message: "feat: онбординг\n\nдетали", author: { name: "Ann", date: old } } }],
          pulls: [{ number: 7, title: "Онбординг", draft: false, created_at: old }],
          issues: [
            { number: 7, title: "Онбординг", updated_at: old, pull_request: {} },
            { number: 3, title: "Баг логина", updated_at: old },
          ],
        })[fn],
      ),
    };

    const a = await repoActivity(octokit as never, "acme/app");
    expect(a.commits).toEqual([{ message: "feat: онбординг", author: "Ann", date: old }]);
    expect(a.openPulls).toEqual([{ number: 7, title: "Онбординг", draft: false, ageDays: 20 }]);
    expect(a.openIssues).toEqual([{ number: 3, title: "Баг логина", idleDays: 20 }]);
  });
});
