import { run, user, type AgentInputItem, type Model } from "@openai/agents";
import { prisma } from "../prisma";
import { ideaScout } from "./scout";

const FLUSH_MS = 700;
const TURN_TIMEOUT_MS = 10 * 60 * 1000;

function searchActivity(action: unknown) {
  const a = (action ?? {}) as { query?: string; queries?: string[]; url?: string };
  const what = a.queries?.join(" · ") ?? a.query ?? a.url;
  return what ? `Ищу: ${what}` : "Ищу в интернете…";
}

export async function executeIdeaTurn(sessionId: string, opts: { model?: Model } = {}) {
  const session = await prisma.ideaSession.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!session?.thinking) return;
  const last = session.messages[0];
  if (last?.role !== "user") {
    await prisma.ideaSession.update({ where: { id: sessionId }, data: { thinking: false } });
    return;
  }

  const reply = await prisma.ideaMessage.create({
    data: { sessionId, role: "assistant", content: "", activity: "Думаю…" },
  });
  const update = (data: { content?: string; activity?: string | null }) =>
    prisma.ideaMessage.update({ where: { id: reply.id }, data });

  try {
    const input = [...(session.history as AgentInputItem[]), user(last.content)];
    const result = await run(ideaScout(opts.model), input, {
      stream: true,
      context: { sessionId },
      maxTurns: 20,
      signal: AbortSignal.timeout(TURN_TIMEOUT_MS),
    });

    // Текст и текущее действие пишем в БД по ходу — UI опрашивает и показывает ответ «вживую».
    let text = "";
    let flushedAt = 0;
    for await (const event of result) {
      if (event.type === "raw_model_stream_event" && event.data.type === "output_text_delta") {
        text += event.data.delta;
        if (Date.now() - flushedAt > FLUSH_MS) {
          flushedAt = Date.now();
          await update({ content: text });
        }
      } else if (event.type === "run_item_stream_event" && event.name === "tool_called") {
        const raw = event.item.rawItem;
        if (raw.type === "hosted_tool_call") await update({ activity: searchActivity(raw.providerData?.action) });
        else if (raw.type === "function_call") await update({ activity: "Сохраняю идею…" });
      }
    }
    await result.completed;
    if (result.error) throw result.error;

    await prisma.$transaction([
      prisma.ideaMessage.update({
        where: { id: reply.id },
        data: { content: String(result.finalOutput ?? text), activity: null },
      }),
      prisma.ideaSession.update({
        where: { id: sessionId },
        data: { history: result.history as object[], thinking: false },
      }),
    ]);
  } catch (err) {
    console.error(`[ideas] turn ${sessionId} failed`, err);
    await update({ content: "Не получилось ответить — попробуйте отправить сообщение ещё раз.", activity: null });
    await prisma.ideaSession.update({ where: { id: sessionId }, data: { thinking: false } });
  }
}
