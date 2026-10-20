import { PgBoss } from "pg-boss";

export const RUN_QUEUE = "agent-run";
export const IDEA_QUEUE = "idea-turn";
export const RUN_TIMEOUT_SECONDS = 15 * 60;

const globalForBoss = globalThis as unknown as { boss?: Promise<PgBoss> };

// Продюсер для Next: без супервизора и расписаний — этим занимается воркер.
export function getBoss(options: { worker?: boolean } = {}) {
  globalForBoss.boss ??= (async () => {
    const boss = new PgBoss({
      connectionString: process.env.DATABASE_URL,
      supervise: options.worker ?? false,
      schedule: options.worker ?? false,
    });
    boss.on("error", (err) => console.error("[pg-boss]", err));
    await boss.start();
    await boss.createQueue(RUN_QUEUE);
    await boss.createQueue(IDEA_QUEUE);
    return boss;
  })();
  return globalForBoss.boss;
}

export async function enqueueRun(runId: string) {
  const boss = await getBoss();
  await boss.send(RUN_QUEUE, { runId }, { expireInSeconds: RUN_TIMEOUT_SECONDS, retryLimit: 0 });
}

export async function enqueueIdeaTurn(sessionId: string) {
  const boss = await getBoss();
  await boss.send(IDEA_QUEUE, { sessionId }, { expireInSeconds: RUN_TIMEOUT_SECONDS, retryLimit: 0 });
}
