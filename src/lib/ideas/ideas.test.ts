import { beforeEach, describe, expect, it } from "vitest";
import { FakeModel } from "../../../test/fake-model";
import { resetDb } from "../../../test/db";
import { prisma } from "../prisma";
import { executeIdeaTurn } from "./turn";
import { ideaForUser, sendIdeaMessage } from "./ops";

beforeEach(async () => {
  await resetDb();
});

const newUser = () => prisma.user.create({ data: { email: `u-${Math.random()}@test.dev` } });

const IDEA = {
  title: "Запись на автомойку через WhatsApp",
  problem: "Очереди на мойках в выходные",
  customer: "Владельцы автомоек на 2–5 постов",
  solution: "Бот записи в WhatsApp",
  why_now: "WhatsApp Business API подешевел",
  risks: "Низкая готовность платить",
  evidence: [{ claim: "Рынок моек растёт", url: "https://example.com/report" }],
};

describe("sendIdeaMessage", () => {
  it("создаёт сессию и не принимает новое сообщение, пока агент думает", async () => {
    const user = await newUser();
    const first = await sendIdeaMessage(user.id, "Я 5 лет в логистике");
    expect(first.accepted).toBe(true);
    expect(first.session.thinking).toBe(true);

    const second = await sendIdeaMessage(user.id, "ещё");
    expect(second).toMatchObject({ accepted: false, session: { id: first.session.id } });
    expect(await prisma.ideaMessage.count()).toBe(1);
  });
});

describe("executeIdeaTurn", () => {
  it("сохраняет идеи-карточки, ответ и историю диалога", async () => {
    const user = await newUser();
    const { session } = await sendIdeaMessage(user.id, "Хочу B2B в Казахстане");

    await executeIdeaTurn(session.id, {
      model: new FakeModel([{ call: { name: "save_idea", args: IDEA } }, { say: "Нашёл одну идею." }]),
    });

    const after = await prisma.ideaSession.findUniqueOrThrow({
      where: { id: session.id },
      include: { messages: { orderBy: { createdAt: "asc" } }, ideas: true },
    });
    expect(after.thinking).toBe(false);
    expect(after.messages.map((m) => [m.role, m.content])).toEqual([
      ["user", "Хочу B2B в Казахстане"],
      ["assistant", "Нашёл одну идею."],
    ]);
    expect(after.ideas[0]).toMatchObject({ title: IDEA.title, whyNow: IDEA.why_now });
    expect((after.history as unknown[]).length).toBeGreaterThan(1);
  });

  it("помнит предыдущие сообщения на следующем ходе", async () => {
    const user = await newUser();
    const { session } = await sendIdeaMessage(user.id, "Я врач-стоматолог");
    await executeIdeaTurn(session.id, { model: new FakeModel([{ say: "Расскажите подробнее." }]) });

    await sendIdeaMessage(user.id, "Есть 2 клиники");
    const model = new FakeModel([{ say: "Понял." }]);
    await executeIdeaTurn(session.id, { model });

    const input = JSON.stringify(model.requests[0].input);
    expect(input).toContain("Я врач-стоматолог");
    expect(input).toContain("Расскажите подробнее.");
    expect(input).toContain("Есть 2 клиники");
  });

  it("ошибка модели — сообщение об ошибке и можно писать дальше", async () => {
    const user = await newUser();
    const { session } = await sendIdeaMessage(user.id, "привет");
    await executeIdeaTurn(session.id, { model: new FakeModel([{ fail: "rate limit" }]) });

    const after = await prisma.ideaSession.findUniqueOrThrow({ where: { id: session.id }, include: { messages: true } });
    expect(after.thinking).toBe(false);
    expect(after.messages.find((m) => m.role === "assistant")?.content).toContain("Не получилось");
    expect((await sendIdeaMessage(user.id, "ещё раз")).accepted).toBe(true);
  });
});

describe("маркеры цитат", () => {
  it("не попадают в ответ и карточку", async () => {
    const cite = "\uE200cite\uE202turn0search0\uE201";
    const user = await newUser();
    const { session } = await sendIdeaMessage(user.id, "ищи");

    await executeIdeaTurn(session.id, {
      model: new FakeModel([
        { call: { name: "save_idea", args: { ...IDEA, problem: `Очереди ${cite}`, evidence: [{ claim: `Рост ${cite}`, url: "https://x.kz" }] } } },
        { say: `Опрос 898 руководителей. ${cite}` },
      ]),
    });

    const after = await prisma.ideaSession.findUniqueOrThrow({ where: { id: session.id }, include: { messages: true, ideas: true } });
    // history — внутренний контекст модели, там маркеры допустимы; видимые данные — без них.
    expect(JSON.stringify([after.messages, after.ideas])).not.toMatch(/[\uE200-\uE2FF]/);
    expect(after.messages.find((m) => m.role === "assistant")?.content).toBe("Опрос 898 руководителей.");
    expect(after.ideas[0].problem).toBe("Очереди");
  });
});

describe("ideaForUser", () => {
  it("не отдаёт чужую идею", async () => {
    const [a, b] = [await newUser(), await newUser()];
    const { session } = await sendIdeaMessage(a.id, "x");
    const idea = await prisma.ideaCandidate.create({
      data: { sessionId: session.id, title: "t", problem: "p", customer: "c", solution: "s", whyNow: "w", risks: "r", evidence: [] },
    });
    expect(await ideaForUser(a.id, idea.id)).not.toBeNull();
    expect(await ideaForUser(b.id, idea.id)).toBeNull();
  });
});

describe("ideaResearchMarkdown", () => {
  it("собирает документ с источниками", async () => {
    const { ideaResearchMarkdown } = await import("./ops");
    const md = ideaResearchMarkdown({ ...IDEA, whyNow: IDEA.why_now });
    expect(md).toContain("# Запись на автомойку через WhatsApp");
    expect(md).toContain("[источник](https://example.com/report)");
  });
});
