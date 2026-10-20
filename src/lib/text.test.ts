import { describe, expect, it } from "vitest";
import { stripCitations } from "./text";

const m = (ref: string) => `cite${ref}`;

describe("stripCitations", () => {
  it("вырезает служебные маркеры цитат web search", () => {
    expect(stripCitations(`Опрос 898 руководителей. ${m("turn0search0")}\n- дальше`)).toBe("Опрос 898 руководителей.\n- дальше");
    expect(stripCitations(`Рынок растёт ${m("turn0search1turn0search2")}.`)).toBe("Рынок растёт.");
  });

  it("не трогает обычный текст и ссылки Markdown", () => {
    const text = "См. [gov.kz](https://gov.kz) — cite и turn0search как слова";
    expect(stripCitations(text)).toBe(text);
  });

  it("убирает незакрытый маркер в конце потока", () => {
    expect(stripCitations("Текст citeturn0sea")).toBe("Текст");
  });
});
