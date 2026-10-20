import { Octokit } from "@octokit/rest";
import { prisma } from "../prisma";

export type MetricInput = { key: string; value: number };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function syncGithub(octokit: Octokit, fullName: string): Promise<MetricInput[]> {
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) throw new Error(`Invalid repo "${fullName}", expected owner/name`);

  const [{ data }, commits] = await Promise.all([
    octokit.rest.repos.get({ owner, repo }),
    octokit.paginate(octokit.rest.repos.listCommits, {
      owner,
      repo,
      since: new Date(Date.now() - WEEK_MS).toISOString(),
      per_page: 100,
    }),
  ]);

  return [
    { key: "commits_7d", value: commits.length },
    { key: "open_issues", value: data.open_issues_count },
    { key: "stars", value: data.stargazers_count },
  ];
}

export async function listRepos(octokit: Octokit) {
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({ sort: "pushed", per_page: 50 });
  return data.map((r) => r.full_name);
}

export async function githubToken(userId: string) {
  const account = await prisma.account.findFirst({ where: { userId, provider: "github" } });
  return account?.access_token ?? null;
}

// Токен владельца + подключённый репозиторий стартапа.
export async function githubAccess(startupId: string) {
  const startup = await prisma.startup.findUniqueOrThrow({
    where: { id: startupId },
    include: { integrations: { where: { provider: "GITHUB" } } },
  });
  const token = await githubToken(startup.userId);
  const repo = (startup.integrations[0]?.config as { repo?: string } | undefined)?.repo;
  return token && repo ? { token, repo, octokit: new Octokit({ auth: token }) } : null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS);

export async function repoActivity(octokit: Octokit, fullName: string) {
  const [owner, repo] = fullName.split("/");
  const [commits, pulls, issues] = await Promise.all([
    octokit.paginate(octokit.rest.repos.listCommits, {
      owner,
      repo,
      since: new Date(Date.now() - WEEK_MS).toISOString(),
      per_page: 100,
    }),
    octokit.paginate(octokit.rest.pulls.list, { owner, repo, state: "open", per_page: 100 }),
    octokit.paginate(octokit.rest.issues.listForRepo, { owner, repo, state: "open", per_page: 100 }),
  ]);

  return {
    repo: fullName,
    commits: commits.map((c) => ({
      message: c.commit.message.split("\n")[0],
      author: c.commit.author?.name ?? c.author?.login ?? "?",
      date: c.commit.author?.date,
    })),
    openPulls: pulls.map((p) => ({ number: p.number, title: p.title, draft: p.draft, ageDays: daysAgo(p.created_at) })),
    // listForRepo возвращает и PR — их отсекаем.
    openIssues: issues
      .filter((i) => !i.pull_request)
      .map((i) => ({ number: i.number, title: i.title, idleDays: daysAgo(i.updated_at) })),
  };
}
