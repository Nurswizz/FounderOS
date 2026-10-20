import { Octokit } from "@octokit/rest";
import type { Provider } from "@/generated/prisma/enums";
import { syncGithub, type MetricInput } from "./github";

type SyncFn = (token: string, config: Record<string, string>) => Promise<MetricInput[]>;

// Новая интеграция = файл в integrations/ + строка здесь + значение в enum Provider.
export const INTEGRATIONS: Record<Provider, SyncFn> = {
  GITHUB: (token, config) => syncGithub(new Octokit({ auth: token }), config.repo),
};
