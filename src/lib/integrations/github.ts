import { Octokit } from "@octokit/rest";

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
