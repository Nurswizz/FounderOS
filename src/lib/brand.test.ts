import { describe, expect, it } from "vitest";
import { brandFor } from "./brand";

describe("brandFor", () => {
  it("находит лого по домену, включая поддомены", () => {
    expect(brandFor("https://github.com/acme/app")?.title).toBe("GitHub");
    expect(brandFor("https://www.notion.so/acme/Plan")?.title).toBe("Notion");
    expect(brandFor("https://docs.google.com/document/d/1")?.title).toBe("Google Docs");
    expect(brandFor("https://twitter.com/acme")?.title).toBe("X");
  });

  it("неизвестный домен или мусор — null", () => {
    expect(brandFor("https://example.com")).toBeNull();
    expect(brandFor("not a url")).toBeNull();
    expect(brandFor(null)).toBeNull();
  });
});
