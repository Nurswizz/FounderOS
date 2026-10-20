import { describe, expect, it } from "vitest";
import { stepLabel, stepSummary } from "./steps";

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
    expect(stepSummary("x", "not json")).toBeNull();
  });
});
