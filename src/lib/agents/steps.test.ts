import { describe, expect, it } from "vitest";
import { rawEventActivity, stepActivity, stepLabel, stepSummary } from "./steps";

describe("steps", () => {
  it("человекочитаемые подписи шагов", () => {
    expect(stepLabel("save_hub_document")).toBe("Сохранил документ");
    expect(stepLabel("unknown_tool")).toBe("unknown_tool");
    expect(stepSummary("save_hub_document", '{"title":"Конкуренты","body":"..."}')).toBe("Конкуренты");
    expect(stepSummary("delegate_task", '{"agent":"CTO","brief":"Дайджест"}')).toBe("CTO: Дайджест");
    expect(stepSummary("web_search_call", '{"type":"search","query":"crm автомойки"}')).toBe("crm автомойки");
    expect(stepSummary("web_search_call", '{"type":"search","queries":["crm казахстан","washflow цена"]}')).toBe("crm казахстан · washflow цена");
    expect(stepSummary("web_search_call", '{"type":"open_page","url":"https://washflow.kz/"}')).toBe("https://washflow.kz/");
    expect(stepSummary("list_hub", "{}")).toBeNull();
    expect(stepSummary("read_hub_entry", '{"id":"cmvh74ngz0005z06zlfthwmro"}')).toBeNull();
    expect(stepSummary("list_roadmap", '{"stage":"IDEA"}')).toBe("Идея");
    expect(stepSummary("list_roadmap", '{"stage":null}')).toBeNull();
    expect(stepSummary("x", "not json")).toBeNull();
  });
});

describe("stepActivity", () => {
  it("описывает текущее действие в настоящем времени с деталями", () => {
    expect(stepActivity("save_hub_document", '{"title":"Конкуренты","body":"..."}')).toBe("Сохраняет документ: Конкуренты");
    expect(stepActivity("web_search_call", '{"type":"search","queries":["crm казахстан"]}')).toBe("Ищет в интернете: crm казахстан");
    expect(stepActivity("list_hub", "{}")).toBe("Просматривает хаб");
    expect(stepActivity("unknown_tool", "{}")).toBe("Работает с инструментом unknown_tool");
  });
});

describe("rawEventActivity", () => {
  const added = (item: object) => ({ type: "response.output_item.added", item });
  const done = (item: object) => ({ type: "response.output_item.done", item });

  it("веб-поиск: начало и запрос, по завершении — шаг для ленты", () => {
    expect(rawEventActivity(added({ type: "web_search_call" }))).toEqual({ activity: "Ищет в интернете" });
    expect(rawEventActivity(done({ type: "web_search_call", action: { type: "search", query: "crm автомойки" } }))).toEqual({
      activity: "Ищет в интернете: crm автомойки",
      step: { tool: "web_search_call", input: '{"type":"search","query":"crm автомойки"}' },
    });
  });

  it("размышление и подготовка вызова инструмента", () => {
    expect(rawEventActivity(added({ type: "reasoning" }))).toEqual({ activity: "Размышляет" });
    expect(rawEventActivity(added({ type: "function_call", name: "save_hub_document" }))).toEqual({ activity: "Сохраняет документ" });
  });

  it("прочие события игнорирует", () => {
    expect(rawEventActivity({ type: "response.output_text.delta", delta: "x" })).toBeNull();
    expect(rawEventActivity(added({ type: "message" }))).toBeNull();
    expect(rawEventActivity(null)).toBeNull();
  });
});
