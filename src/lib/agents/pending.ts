import { githubAccess } from "../integrations/github";
import { prisma } from "../prisma";

type GithubAccess = NonNullable<Awaited<ReturnType<typeof githubAccess>>>;
type Executor = (gh: GithubAccess, payload: Record<string, unknown>) => Promise<string>;

const EXECUTORS: Record<string, Executor> = {
  GITHUB_ISSUE: async ({ octokit, repo }, p) => {
    const [owner, name] = repo.split("/");
    const { data } = await octokit.rest.issues.create({ owner, repo: name, title: String(p.title), body: String(p.body) });
    return data.html_url;
  },
  GITHUB_PR_COMMENT: async ({ octokit, repo }, p) => {
    const [owner, name] = repo.split("/");
    const { data } = await octokit.rest.issues.createComment({
      owner,
      repo: name,
      issue_number: Number(p.number),
      body: String(p.body),
    });
    return data.html_url;
  },
};

export async function resolveAction(
  startupId: string,
  id: string,
  approve: boolean,
  access: (startupId: string) => Promise<GithubAccess | null> = githubAccess,
) {
  // Атомарно забираем PENDING — двойной клик не выполнит действие дважды.
  const { count } = await prisma.pendingAction.updateMany({
    where: { id, startupId, status: "PENDING" },
    data: { status: approve ? "APPROVED" : "REJECTED", resolvedAt: new Date() },
  });
  if (!count) return null;
  if (!approve) return prisma.pendingAction.findUnique({ where: { id } });

  const action = await prisma.pendingAction.findUniqueOrThrow({ where: { id } });
  try {
    const gh = await access(startupId);
    if (!gh) throw new Error("GitHub не подключён");
    const result = await EXECUTORS[action.kind](gh, action.payload as Record<string, unknown>);
    return prisma.pendingAction.update({ where: { id }, data: { result } });
  } catch (err) {
    return prisma.pendingAction.update({
      where: { id },
      data: { status: "FAILED", result: err instanceof Error ? err.message : String(err) },
    });
  }
}
