import { Octokit } from "@octokit/rest";
import { RefreshCw, Unplug } from "lucide-react";
import { siGithub } from "simple-icons";
import { connectGithub, disconnectIntegration, syncIntegration } from "@/app/actions";
import { BrandIcon } from "@/components/brand-icon";
import { buttonCls, ghostCls, inputCls, PageHeader } from "@/components/ui";
import { listRepos } from "@/lib/integrations/github";
import { prisma } from "@/lib/prisma";
import { githubToken, requireStartup } from "@/lib/session";

const ERRORS: Record<string, string> = {
  token: "Нет доступа к GitHub. Выйдите и войдите снова.",
  sync: "Не удалось получить данные из GitHub. Проверьте доступ к репозиторию.",
};

export default async function Integrations({ searchParams }: PageProps<"/settings/integrations">) {
  const startup = await requireStartup();
  const { error } = await searchParams;
  const token = await githubToken(startup.userId);
  const github = await prisma.integration.findUnique({
    where: { startupId_provider: { startupId: startup.id, provider: "GITHUB" } },
  });
  const repos = token ? await listRepos(new Octokit({ auth: token })).catch(() => []) : [];
  const repo = (github?.config as { repo?: string } | null)?.repo;

  return (
    <>
      <PageHeader title="Интеграции" subtitle="Подтягивайте метрики из рабочих инструментов" />

      {typeof error === "string" && ERRORS[error] ? (
        <p className="mb-4 rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 dark:border-red-900">{ERRORS[error]}</p>
      ) : null}

      <section className="max-w-xl rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex items-start gap-4">
          <span className="rounded-md border border-zinc-200 p-2 dark:border-zinc-800 dark:bg-white">
            <BrandIcon icon={siGithub} size={24} />
          </span>
          <div className="flex-1">
            <h2 className="font-medium">GitHub</h2>
            <p className="text-sm text-zinc-500">Коммиты за неделю, открытые issues, звёзды.</p>
            {github ? (
              <p className="mt-2 text-xs text-zinc-400">
                {repo} · {github.lastSyncedAt ? `синхронизировано ${github.lastSyncedAt.toLocaleString("ru")}` : "ещё не синхронизировано"}
              </p>
            ) : null}
          </div>
        </div>

        <form action={connectGithub} className="mt-5 flex gap-2">
          <select name="repo" required defaultValue={repo ?? ""} className={inputCls}>
            <option value="" disabled>Выберите репозиторий</option>
            {repos.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className={buttonCls + " shrink-0"}>{github ? "Сохранить" : "Подключить"}</button>
        </form>

        {github ? (
          <div className="mt-3 flex gap-1">
            <form action={syncIntegration}>
              <input type="hidden" name="provider" value="GITHUB" />
              <button className={ghostCls}><RefreshCw size={14} /> Синхронизировать</button>
            </form>
            <form action={disconnectIntegration}>
              <input type="hidden" name="provider" value="GITHUB" />
              <button className={ghostCls}><Unplug size={14} /> Отключить</button>
            </form>
          </div>
        ) : null}
      </section>
    </>
  );
}
