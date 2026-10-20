import { describe, expect, it } from "vitest";
import { detectStage } from "./onboarding";

const no = { problemDefined: false, problemValidated: false, productBuilt: false, launched: false };

describe("detectStage", () => {
  it("определяет стадию по последовательным чекпоинтам", () => {
    expect(detectStage(no)).toBe("IDEA");
    expect(detectStage({ ...no, problemDefined: true })).toBe("VALIDATION");
    expect(detectStage({ ...no, problemDefined: true, problemValidated: true })).toBe("MVP");
    expect(
      detectStage({ problemDefined: true, problemValidated: true, productBuilt: true, launched: false }),
    ).toBe("LAUNCH");
    expect(
      detectStage({ problemDefined: true, problemValidated: true, productBuilt: true, launched: true }),
    ).toBe("GROWTH");
  });

  it("пропущенный чекпоинт останавливает продвижение", () => {
    expect(detectStage({ ...no, problemDefined: true, productBuilt: true, launched: true })).toBe(
      "VALIDATION",
    );
  });
});
