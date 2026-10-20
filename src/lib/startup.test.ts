import { describe, expect, it } from "vitest";
import { parseStartupProfile } from "./startup";

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  Object.entries(fields).forEach(([k, v]) => f.set(k, v));
  return f;
};

describe("parseStartupProfile", () => {
  it("обрезает пробелы, пустая отрасль — null", () => {
    expect(parseStartupProfile(form({ name: "  Acme ", industry: " ", description: " CRM для моек " }))).toEqual({
      name: "Acme",
      industry: null,
      description: "CRM для моек",
    });
  });

  it("без названия или описания — null", () => {
    expect(parseStartupProfile(form({ name: "", description: "x" }))).toBeNull();
    expect(parseStartupProfile(form({ name: "Acme", description: "  " }))).toBeNull();
  });

  it("ограничивает длину полей", () => {
    const p = parseStartupProfile(form({ name: "a".repeat(500), industry: "b".repeat(500), description: "c".repeat(9000) }))!;
    expect([p.name.length, p.industry!.length, p.description.length]).toEqual([80, 80, 4000]);
  });
});
