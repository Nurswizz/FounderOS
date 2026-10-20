import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { PendingHint, SubmitButton } from "@/components/submit-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { inputCls } from "@/components/ui";
import { ideaForUser } from "@/lib/ideas/ops";
import { CHECKPOINTS } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { createStartup } from "../actions";

export default async function Onboarding({ searchParams }: PageProps<"/onboarding">) {
  const userId = await requireUserId();
  if (await prisma.startup.findUnique({ where: { userId } })) redirect("/dashboard");
  const { idea: ideaId } = await searchParams;
  const idea = typeof ideaId === "string" ? await ideaForUser(userId, ideaId) : null;
  const description = idea ? `${idea.problem}\n\nКлиент: ${idea.customer}\nРешение: ${idea.solution}`.slice(0, 4000) : undefined;

  return (
    <main className="mx-auto max-w-xl px-6 py-16 motion-safe:animate-fade-up">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Расскажите о стартапе</h1>
      <p className="mt-1 text-sm text-zinc-500">На основе ответов соберём персональный роадмап.</p>
      {idea ? (
        <p className="mt-6 flex items-center gap-2 rounded-md border border-indigo-200 px-3 py-2 text-sm text-indigo-600 dark:border-indigo-900">
          <Compass size={16} /> Идея от скаута — исследование сохраним в хаб проекта.
        </p>
      ) : (
        <Link
          href="/ideas"
          className="mt-6 flex items-center gap-3 rounded-lg border border-zinc-200 p-4 text-sm transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <Compass size={18} className="shrink-0 text-indigo-600" />
          <span className="flex-1">
            <span className="font-medium">Нет идеи?</span>{" "}
            <span className="text-zinc-500">Обсудите с Идейным скаутом — он изучит рынок и предложит варианты под ваш опыт.</span>
          </span>
          <ArrowRight size={16} className="text-zinc-400" />
        </Link>
      )}

      <form action={createStartup} className="mt-8 space-y-5">
        {idea ? <input type="hidden" name="ideaId" value={idea.id} /> : null}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Название</span>
          <input name="name" required defaultValue={idea?.title} className={inputCls} placeholder="Acme" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Отрасль</span>
          <input name="industry" className={inputCls} placeholder="B2B SaaS, EdTech, маркетплейс..." />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Что вы делаете и для кого</span>
          <textarea name="description" required rows={idea ? 7 : 4} defaultValue={description} className={inputCls} placeholder="Помогаем автомойкам ..." />
        </label>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Что уже сделано</legend>
          {CHECKPOINTS.map((c) => (
            <label key={c.key} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <input type="checkbox" name={c.key} className="size-4 accent-indigo-600" />
              {c.label}
            </label>
          ))}
        </fieldset>

        <SubmitButton pendingText="Собираем роадмап…">
          Собрать роадмап <ArrowRight size={16} />
        </SubmitButton>
        <PendingHint>
          <div className="flex items-start gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <Sparkles size={16} className="mt-0.5 shrink-0 animate-pulse text-indigo-600" />
            <div className="flex-1 space-y-2">
              <p className="text-sm">AI подбирает задачи под ваш стартап — это займёт около 10 секунд.</p>
              <div className="h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div className="h-full w-1/3 rounded-full bg-indigo-600 motion-safe:animate-[indeterminate_1.4s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        </PendingHint>
      </form>
    </main>
  );
}
