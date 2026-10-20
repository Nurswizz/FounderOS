import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, Compass, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { AutoRefresh } from "@/components/auto-refresh";
import { ChatInput, ScrollAnchor } from "@/components/chat-input";
import { Markdown } from "@/components/markdown";
import { SubmitButton } from "@/components/submit-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ghostCls } from "@/components/ui";
import type { Evidence } from "@/lib/ideas/ops";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { restartIdeas, sendIdeaMessageAction } from "../actions";

const STARTERS = [
  "Я разработчик и хочу сделать B2B SaaS",
  "У меня 5 лет опыта в ритейле, ищу проблему, которую можно решить",
  "Не знаю, с чего начать — задай мне вопросы",
];

export default async function IdeasPage() {
  const userId = await requireUserId();
  if (await prisma.startup.findUnique({ where: { userId } })) redirect("/dashboard");

  const session = await prisma.ideaSession.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } }, ideas: { orderBy: { createdAt: "desc" } } },
  });
  const messages = session?.messages ?? [];
  const ideas = session?.ideas ?? [];
  const thinking = session?.thinking ?? false;
  const last = messages.at(-1);

  return (
    <div className="flex h-dvh flex-col">
      <AutoRefresh active={thinking} intervalMs={1000} />
      <header className="flex items-center gap-4 border-b border-zinc-200 px-4 py-3 md:px-8 dark:border-zinc-800">
        <Link href="/onboarding" className={ghostCls}>
          <ArrowLeft size={16} /> У меня есть идея
        </Link>
        <h1 className="flex items-center gap-2 text-sm font-medium">
          <Compass size={16} className="text-indigo-600" /> Идейный скаут
        </h1>
        <div className="ml-auto flex items-center gap-2">
          {messages.length ? (
            <form action={restartIdeas}>
              <SubmitButton className={ghostCls} pendingText="…">
                <RotateCcw size={14} /> Начать заново
              </SubmitButton>
            </form>
          ) : null}
          <ThemeToggle />
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-8 md:px-8">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="flex gap-3 motion-safe:animate-fade-up">
                <Avatar />
                <div className="space-y-3 text-sm">
                  <p>
                    Привет! Помогу найти идею стартапа, которая опирается на ваш опыт и реальные проблемы рынка.
                    Расскажите о себе: чем занимаетесь, в каких сферах разбираетесь, с какими проблемами сталкивались?
                  </p>
                  {!messages.length ? (
                    <div className="flex flex-wrap gap-2">
                      {STARTERS.map((text) => (
                        <form key={text} action={sendIdeaMessageAction}>
                          <input type="hidden" name="text" value={text} />
                          <button className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100">
                            {text}
                          </button>
                        </form>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end motion-safe:animate-fade-up">
                    <p className="max-w-[80%] rounded-lg bg-zinc-100 px-4 py-2.5 text-sm whitespace-pre-line dark:bg-zinc-900">{m.content}</p>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-3 motion-safe:animate-fade-up">
                    <Avatar />
                    <div className="min-w-0 flex-1 space-y-2">
                      {m.content ? <Markdown>{m.content}</Markdown> : null}
                      {m.activity ? (
                        <p className="flex items-center gap-2 text-xs text-indigo-600">
                          <Loader2 size={12} className="shrink-0 animate-spin" />
                          <span className="truncate">{m.activity}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                ),
              )}
              {thinking && last?.role === "user" ? (
                <div className="flex gap-3">
                  <Avatar />
                  <p className="flex items-center gap-2 text-xs text-zinc-400"><Loader2 size={12} className="animate-spin" /> Скаут читает…</p>
                </div>
              ) : null}
              <ScrollAnchor dep={`${messages.length}:${last?.content.length ?? 0}:${last?.activity ?? ""}`} />
            </div>
          </div>
          <div className="border-t border-zinc-200 px-4 py-4 md:px-8 dark:border-zinc-800">
            <div className="mx-auto max-w-3xl">
              <ChatInput
                action={sendIdeaMessageAction}
                disabled={thinking}
                placeholder={thinking ? "Скаут отвечает…" : "Расскажите о себе или ответьте на вопрос. Enter — отправить"}
              />
            </div>
          </div>
        </section>

        <aside className="hidden min-h-0 overflow-y-auto border-l border-zinc-200 p-6 lg:block dark:border-zinc-800">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-500">
            <Sparkles size={14} /> Идеи · {ideas.length}
          </h2>
          {ideas.length ? (
            <ul className="space-y-4">
              {ideas.map((idea) => (
                <li key={idea.id} className="space-y-3 rounded-lg border border-zinc-200 p-4 text-sm motion-safe:animate-fade-up dark:border-zinc-800">
                  <h3 className="font-medium">{idea.title}</h3>
                  <dl className="space-y-2 text-xs">
                    {[
                      ["Проблема", idea.problem],
                      ["Клиент", idea.customer],
                      ["Решение", idea.solution],
                      ["Почему сейчас", idea.whyNow],
                    ].map(([label, text]) => (
                      <div key={label}>
                        <dt className="text-zinc-400">{label}</dt>
                        <dd className="text-zinc-700 dark:text-zinc-300">{text}</dd>
                      </div>
                    ))}
                  </dl>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                      Риски и источники
                    </summary>
                    <p className="mt-2 text-zinc-600 dark:text-zinc-400">{idea.risks}</p>
                    <ul className="mt-2 space-y-1">
                      {(idea.evidence as Evidence).map((e) => (
                        <li key={e.url + e.claim}>
                          <a href={e.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{e.claim}</a>
                        </li>
                      ))}
                    </ul>
                  </details>
                  <Link
                    href={`/onboarding?idea=${idea.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium transition-colors hover:border-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-100"
                  >
                    Выбрать <ArrowRight size={14} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-400">Здесь появятся идеи с фактами и источниками — после пары ответов о вас.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <span className="grid size-7 shrink-0 place-items-center rounded-md border border-zinc-200 text-indigo-600 dark:border-zinc-800">
      <Compass size={14} />
    </span>
  );
}
