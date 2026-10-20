import { Agent, run, type Model } from "@openai/agents";
import { prisma } from "../prisma";
import { RUN_TIMEOUT_SECONDS } from "../queue";
import { stripCitations } from "../text";
import { AGENTS } from ".";
import { getOverview } from "./ops";
import { rawEventActivity, stepActivity } from "./steps";
import type { AgentContext } from "./tools";

const MAX_TURNS = 25;
const DRAFT_FLUSH_MS = 600;
const TRIGGER_LABELS = { MANUAL: "от основателя", SCHEDULE: "по расписанию", DELEGATED: "от Chief of Staff" };

export async function executeRun(runId: string, opts: { model?: Model } = {}) {
  // Захватываем только QUEUED — повторная доставка задачи не перезапустит работу.
  const claimed = await prisma.agentRun.updateMany({
    where: { id: runId, status: "QUEUED" },
    data: { status: "RUNNING", startedAt: new Date(), activity: "Изучает задачу и контекст стартапа" },
  });
  if (!claimed.count) return;

  const record = await prisma.agentRun.findUniqueOrThrow({ where: { id: runId } });
  const def = AGENTS[record.agent];
  const agent = new Agent<AgentContext>({
    name: def.title,
    instructions: def.instructions,
    tools: def.tools,
    model: opts.model ?? process.env.OPENAI_MODEL ?? "gpt-6-luna",
  });

  // Хуки SDK синхронные — записи в БД выстраиваем в одну цепочку, чтобы статусы не обгоняли друг друга.
  let writes: Promise<unknown> = Promise.resolve();
  const enqueue = (write: () => Promise<unknown>) => {
    writes = writes.then(write).catch((err) => console.error(`[agent] live write failed`, err));
  };
  const live = (data: { activity?: string; draft?: string | null }) =>
    enqueue(() => prisma.agentRun.update({ where: { id: runId }, data }));
  const argsOf = (call: { arguments?: string }) => call.arguments || "";

  agent.on("agent_tool_start", (_ctx, tool, { toolCall }) => {
    live({ activity: stepActivity(tool.name, argsOf(toolCall as { arguments?: string })), draft: null });
  });
  agent.on("agent_tool_end", (_ctx, tool, result, { toolCall }) => {
    const input = argsOf(toolCall as { arguments?: string });
    enqueue(() => prisma.agentStep.create({ data: { runId, tool: tool.name, input, output: result.slice(0, 20_000) } }));
    live({ activity: "Думает над следующим шагом" });
  });

  const input = `${await getOverview(record.startupId)}\n\n---\nЗадача ${TRIGGER_LABELS[record.trigger]}:\n${record.brief}`;

  try {
    const result = await run(agent, input, {
      stream: true,
      context: { startupId: record.startupId, runId },
      maxTurns: MAX_TURNS,
      signal: AbortSignal.timeout(RUN_TIMEOUT_SECONDS * 1000),
    });

    let draft = "";
    let flushedAt = 0;
    let liveSearches = 0;
    for await (const event of result) {
      if (event.type === "raw_model_stream_event" && event.data.type === "model") {
        const raw = rawEventActivity(event.data.event);
        if (!raw) continue;
        if (raw.step) {
          const step = raw.step;
          liveSearches++;
          enqueue(() => prisma.agentStep.create({ data: { runId, ...step, output: "" } }));
        }
        live({ activity: raw.activity, draft: null });
        continue;
      }
      // Текст ответа — в черновик по ходу генерации.
      if (event.type === "raw_model_stream_event" && event.data.type === "output_text_delta") {
        draft += event.data.delta;
        if (Date.now() - flushedAt > DRAFT_FLUSH_MS) {
          flushedAt = Date.now();
          live({ activity: "Пишет ответ", draft: stripCitations(draft) });
        }
        continue;
      }
      if (event.type !== "run_item_stream_event" || event.name !== "tool_called") continue;
      draft = "";
      // Hosted tools (веб-поиск) не вызывают хуки. Обычно шаг уже записан по сырому событию выше,
      // иначе (провайдер без сырых событий) — пишем здесь.
      const raw = event.item.rawItem;
      if (raw.type === "hosted_tool_call" && liveSearches > 0) liveSearches--;
      else if (raw.type === "hosted_tool_call") {
        const input = JSON.stringify(raw.providerData?.action ?? {});
        enqueue(() => prisma.agentStep.create({ data: { runId, tool: raw.name, input, output: "" } }));
        live({ activity: stepActivity(raw.name, input), draft: null });
      }
    }
    await result.completed;
    if (result.error) throw result.error;
    await writes;
    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: "DONE",
        output: stripCitations(String(result.finalOutput ?? "")),
        activity: null,
        draft: null,
        finishedAt: new Date(),
      },
    });
  } catch (err) {
    await writes;
    console.error(`[agent:${record.agent}] run ${runId} failed`, err);
    await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: "FAILED",
        error: err instanceof Error ? err.message : String(err),
        activity: null,
        draft: null,
        finishedAt: new Date(),
      },
    });
  }
}
