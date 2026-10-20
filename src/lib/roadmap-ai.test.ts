import { describe, expect, it, vi } from "vitest";
import { generateRoadmap } from "./roadmap-ai";
import { ROADMAP_TEMPLATE } from "./roadmap-template";

const startup = { name: "Acme", description: "CRM для автомоек", industry: "SaaS", stage: "VALIDATION" as const };

function fakeClient(parse: () => Promise<unknown>) {
  return { chat: { completions: { parse: vi.fn(parse) } } } as never;
}

describe("generateRoadmap", () => {
  it("возвращает задачи от модели с source=AI", async () => {
    const client = fakeClient(async () => ({
      choices: [
        {
          message: {
            parsed: {
              items: [
                { stage: "VALIDATION", title: "10 интервью с владельцами автомоек", description: "..." },
                { stage: "MVP", title: "Запись клиентов через WhatsApp", description: "..." },
              ],
            },
          },
        },
      ],
    }));

    const items = await generateRoadmap(startup, client);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ stage: "VALIDATION", source: "AI", order: 0 });
  });

  it("без клиента — шаблон", async () => {
    const items = await generateRoadmap(startup, null);
    expect(items).toHaveLength(ROADMAP_TEMPLATE.length);
    expect(items.every((i) => i.source === "TEMPLATE")).toBe(true);
  });

  it("ошибка или пустой ответ модели — шаблон", async () => {
    const failing = fakeClient(async () => {
      throw new Error("rate limit");
    });
    const empty = fakeClient(async () => ({ choices: [{ message: { parsed: { items: [] } } }] }));

    expect((await generateRoadmap(startup, failing))[0].source).toBe("TEMPLATE");
    expect((await generateRoadmap(startup, empty))[0].source).toBe("TEMPLATE");
  });
});
