import "dotenv/config";
import { AGENT_LIST } from "./lib/agents";
import { createScheduledRuns } from "./lib/agents/ops";
import { executeRun } from "./lib/agents/runner";
import { prisma } from "./lib/prisma";
import { enqueueRun, getBoss, RUN_QUEUE } from "./lib/queue";

const CONCURRENCY = Number(process.env.AGENT_CONCURRENCY ?? 3);
const scheduleQueue = (key: string) => `agent-schedule-${key.toLowerCase()}`;

async function main() {
  const boss = await getBoss({ worker: true });

  // Запуски, оборванные падением воркера, иначе навсегда останутся RUNNING.
  const stale = await prisma.agentRun.updateMany({
    where: { status: "RUNNING" },
    data: { status: "FAILED", error: "Воркер был перезапущен во время выполнения", finishedAt: new Date() },
  });
  if (stale.count) console.log(`[worker] marked ${stale.count} interrupted runs as failed`);

  await boss.work<{ runId: string }>(RUN_QUEUE, { localConcurrency: CONCURRENCY }, async ([job]) => {
    await executeRun(job.data.runId);
  });

  for (const agent of AGENT_LIST) {
    const name = scheduleQueue(agent.key);
    if (!agent.schedule) continue;
    await boss.createQueue(name);
    await boss.schedule(name, process.env.AGENT_CRON_OVERRIDE ?? agent.schedule.cron, null, {
      tz: process.env.TZ ?? "Asia/Almaty",
    });
    await boss.work(name, async () => {
      const ids = await createScheduledRuns(agent.key, agent.schedule!.brief);
      await Promise.all(ids.map(enqueueRun));
      if (ids.length) console.log(`[worker] ${agent.key}: scheduled ${ids.length} runs`);
    });
  }

  console.log(`[worker] started, concurrency ${CONCURRENCY}`);
  const shutdown = async () => {
    await boss.stop({ graceful: true, timeout: 30_000 });
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("[worker] fatal", err);
  process.exit(1);
});
