import { describe, expect, it, vi } from "vitest";
import { syncGithub } from "./github";

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
