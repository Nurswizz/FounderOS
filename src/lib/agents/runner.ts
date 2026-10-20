import { Agent, run, type Model } from "@openai/agents";
import { prisma } from "../prisma";
import { RUN_TIMEOUT_SECONDS } from "../queue";
import { stripCitations } from "../text";
import { AGENTS } from ".";
import { getOverview } from "./ops";
import type { AgentContext } from "./tools";

const MAX_TURNS = 25;
const TRIGGER_LABELS = { MANUAL: "от основателя", SCHEDULE: "по расписанию", DELEGATED: "от Chief of Staff" };

export async function executeRun(runId: string, opts: { model?: Model } = {}) {
  // Захватываем только QUEUED — повторная доставка задачи не перезапустит работу.
  const claimed = await prisma.agentRun.updateMany({
    where: { id: runId, status: "QUEUED" },
    data: { status: "RUNNING", startedAt: new Date() },
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

  const stepWrites: Promise<unknown>[] = [];
  agent.on("agent_tool_end", (_ctx, tool, result, { toolCall }) => {
    stepWrites.push(
      prisma.agentStep.create({
        data: {
          runId,
          tool: tool.name,
          input: ("arguments" in toolCall && toolCall.arguments) || "",
          output: result.slice(0, 20_000),
        },
      }),
    );
  });

  const input = `${await getOverview(record.startupId)}\n\n---\nЗадача ${TRIGGER_LABELS[record.trigger]}:\n${record.brief}`;

  try {
    const result = await run(agent, input, {
      stream: true,
      context: { startupId: record.startupId, runId },
      maxTurns: MAX_TURNS,
      signal: AbortSignal.timeout(RUN_TIMEOUT_SECONDS * 1000),
    });

    // Hosted tools (веб-поиск) выполняются на стороне OpenAI и не вызывают agent_tool_end — ловим их в стриме.
    for await (const event of result) {
      if (event.type !== "run_item_stream_event" || event.name !== "tool_called") continue;
      const raw = event.item.rawItem;
      if (raw.type === "hosted_tool_call") {
        stepWrites.push(
          prisma.agentStep.create({
            data: { runId, tool: raw.name, input: JSON.stringify(raw.providerData?.action ?? {}), output: "" },
          }),
        );
      }
    }
    await result.completed;
    if (result.error) throw result.error;
    await Promise.allSettled(stepWrites);
    await prisma.agentRun.update({
      where: { id: runId },
      data: { status: "DONE", output: stripCitations(String(result.finalOutput ?? "")), finishedAt: new Date() },
    });
  } catch (err) {
    await Promise.allSettled(stepWrites);
    console.error(`[agent:${record.agent}] run ${runId} failed`, err);
    await prisma.agentRun.update({
      where: { id: runId },
      data: { status: "FAILED", error: err instanceof Error ? err.message : String(err), finishedAt: new Date() },
    });
  }
}
