import { Usage, type Model, type ModelRequest, type ModelResponse, type StreamEvent } from "@openai/agents";

type Turn =
  | { call: { name: string; args: Record<string, unknown> } }
  | { search: string; say: string }
  | { say: string }
  | { fail: string };

const message = (text: string) => ({
  type: "message" as const,
  role: "assistant" as const,
  status: "completed" as const,
  content: [{ type: "output_text" as const, text }],
});

// Модель-заглушка: отдаёт заранее заданные ходы, запросы складывает в `requests`.
export class FakeModel implements Model {
  requests: ModelRequest[] = [];
  constructor(
    private turns: Turn[],
    // Вызывается перед каждым ходом модели — чтобы тест мог посмотреть промежуточное состояние.
    private onTurn?: (turn: number) => Promise<void>,
  ) {}

  private next(request: ModelRequest) {
    this.requests.push(request);
    const turn = this.turns.shift() ?? { say: "Готово." };
    if ("fail" in turn) throw new Error(turn.fail);
    if ("call" in turn) {
      return [{
        type: "function_call" as const,
        callId: `call_${this.requests.length}`,
        name: turn.call.name,
        arguments: JSON.stringify(turn.call.args),
        status: "completed" as const,
      }];
    }
    if ("search" in turn) {
      return [
        {
          type: "hosted_tool_call" as const,
          name: "web_search_call",
          status: "completed",
          providerData: { action: { type: "search", queries: [turn.search] } },
        },
        message(turn.say),
      ];
    }
    return [message(turn.say)];
  }

  async getResponse(request: ModelRequest): Promise<ModelResponse> {
    return { output: this.next(request), usage: new Usage() };
  }

  async *getStreamedResponse(request: ModelRequest): AsyncIterable<StreamEvent> {
    await this.onTurn?.(this.requests.length + 1);
    const output = this.next(request);
    for (const item of output) {
      // Как OpenAI Responses: сырые события веб-поиска приходят до конца ответа.
      if (item.type === "hosted_tool_call") {
        const raw = { type: "web_search_call", action: item.providerData.action };
        yield { type: "model", event: { type: "response.output_item.added", item: { type: "web_search_call" } } } as StreamEvent;
        yield { type: "model", event: { type: "response.output_item.done", item: raw } } as StreamEvent;
      }
      if (item.type === "message") {
        for (const word of item.content[0].text.split(/(?<= )/)) {
          yield { type: "output_text_delta", delta: word } as StreamEvent;
        }
      }
    }
    yield {
      type: "response_done",
      response: {
        id: `resp_${this.requests.length}`,
        usage: { requests: 1, inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        output,
      },
    } as StreamEvent;
  }
}
