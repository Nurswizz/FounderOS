import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { buttonCls, inputCls } from "@/components/ui";
import { CHECKPOINTS } from "@/lib/onboarding";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { createStartup } from "../actions";

export default async function Onboarding() {
  const userId = await requireUserId();
  if (await prisma.startup.findUnique({ where: { userId } })) redirect("/dashboard");

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Расскажите о стартапе</h1>
      <p className="mt-1 text-sm text-zinc-500">На основе ответов соберём персональный роадмап.</p>

      <form action={createStartup} className="mt-8 space-y-5">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Название</span>
          <input name="name" required className={inputCls} placeholder="Acme" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Отрасль</span>
          <input name="industry" className={inputCls} placeholder="B2B SaaS, EdTech, маркетплейс..." />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Что вы делаете и для кого</span>
          <textarea name="description" required rows={4} className={inputCls} placeholder="Помогаем автомойкам ..." />
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

        <button className={buttonCls}>
          Собрать роадмап <ArrowRight size={16} />
        </button>
      </form>
    </main>
  );
}
