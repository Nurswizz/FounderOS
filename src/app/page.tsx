import { redirect } from "next/navigation";
import { BarChart3, Compass, Layers } from "lucide-react";
import { siGithub } from "simple-icons";
import { auth } from "@/auth";
import { BrandIcon } from "@/components/brand-icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { SubmitButton } from "@/components/submit-button";
import { buttonCls } from "@/components/ui";
import { signInWithGithub } from "./actions";

const FEATURES = [
  { icon: Compass, title: "Роадмап по стадиям", text: "От идеи до роста — конкретные шаги под ваш стартап." },
  { icon: Layers, title: "Всё в одном месте", text: "Ссылки, документы, контакты и заметки без хаоса вкладок." },
  { icon: BarChart3, title: "Прогресс и метрики", text: "Видно, где вы сейчас и что делать дальше." },
];

export default async function Landing() {
  if ((await auth())?.user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-6 py-20 motion-safe:animate-fade-up">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <p className="text-sm font-medium text-indigo-600">FounderOS</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
        Понятный путь для основателя стартапа
      </h1>
      <p className="mt-4 max-w-xl text-zinc-500">
        Пошаговый роадмап, единое место для критичной информации и трекинг прогресса.
      </p>
      <form action={signInWithGithub} className="mt-8">
        <SubmitButton className={buttonCls + " px-4 py-2.5"} pendingText="Переходим в GitHub…">
          <BrandIcon icon={siGithub} size={16} mono />
          Войти через GitHub
        </SubmitButton>
      </form>
      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title}>
            <Icon size={18} className="text-zinc-400" />
            <h3 className="mt-3 text-sm font-medium">{title}</h3>
            <p className="mt-1 text-sm text-zinc-500">{text}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
