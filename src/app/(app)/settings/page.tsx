import Link from "next/link";
import { CheckCircle2, Info, Trash2 } from "lucide-react";
import { deleteStartup, updateStartup } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { inputCls, Section } from "@/components/ui";
import { requireStartup } from "@/lib/session";

const ERRORS: Record<string, string> = {
  invalid: "Название и описание не могут быть пустыми.",
  confirm: "Название не совпало — проект не удалён.",
};

export default async function ProjectSettings({ searchParams }: PageProps<"/settings">) {
  const startup = await requireStartup();
  const { saved, error } = await searchParams;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Section title="Проект">
        {saved ? (
          <p className="mb-4 flex items-center gap-2 text-sm text-emerald-600 motion-safe:animate-fade-up">
            <CheckCircle2 size={16} /> Сохранено
          </p>
        ) : null}
        {typeof error === "string" && ERRORS[error] ? (
          <p className="mb-4 rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 dark:border-red-900">{ERRORS[error]}</p>
        ) : null}

        <form action={updateStartup} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Название</span>
              <input name="name" required maxLength={80} defaultValue={startup.name} className={inputCls} />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Отрасль</span>
              <input name="industry" maxLength={80} defaultValue={startup.industry ?? ""} placeholder="B2B SaaS, EdTech, маркетплейс..." className={inputCls} />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Идея: что вы делаете и для кого</span>
            <textarea name="description" required rows={8} maxLength={4000} defaultValue={startup.description} className={inputCls} />
          </label>
          <SubmitButton pendingText="Сохраняем…">Сохранить</SubmitButton>
        </form>
      </Section>

      <div className="space-y-6">
        <Section title="Как это используется">
          <p className="flex gap-3 text-sm text-zinc-500">
            <Info size={16} className="mt-0.5 shrink-0" />
            <span>
              Описание проекта — главный контекст для AI: агенты команды читают его при каждом запуске. Если идея
              изменилась, сохраните её и{" "}
              <Link href="/roadmap" className="text-indigo-600 hover:underline">перегенерируйте роадмап</Link>.
            </span>
          </p>
        </Section>

        <Section title="Опасная зона" className="border-red-200 hover:border-red-300 dark:border-red-950 dark:hover:border-red-900">
          <p className="mb-4 text-sm text-zinc-500">
            Удалит проект со всем роадмапом, хабом, метриками и работой агентов. Отменить нельзя. Для подтверждения
            введите название проекта: <span className="font-medium text-zinc-900 dark:text-zinc-100">{startup.name}</span>
          </p>
          <form action={deleteStartup} className="flex flex-col gap-2 sm:flex-row">
            <input name="confirm" required autoComplete="off" placeholder="Название проекта" className={inputCls} />
            <SubmitButton
              pendingText="Удаляем…"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
            >
              <Trash2 size={14} /> Удалить проект
            </SubmitButton>
          </form>
        </Section>
      </div>
    </div>
  );
}
