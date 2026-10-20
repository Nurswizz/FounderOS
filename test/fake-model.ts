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
  constructor(private turns: Turn[]) {}

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
    const output = this.next(request);
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
