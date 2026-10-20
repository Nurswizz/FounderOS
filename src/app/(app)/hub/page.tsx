import Link from "next/link";
import { Plus } from "lucide-react";
import { createHubEntry } from "@/app/actions";
import { HubEntryRow } from "@/components/hub-entry";
import { SubmitButton } from "@/components/submit-button";
import { Empty, inputCls, PageHeader } from "@/components/ui";
import { HubKind } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { requireStartup } from "@/lib/session";

const KIND_LABELS: Record<HubKind, string> = { LINK: "Ссылки", NOTE: "Заметки", CONTACT: "Контакты", DOC: "Документы" };

export default async function Hub({ searchParams }: PageProps<"/hub">) {
  const startup = await requireStartup();
  const { kind } = await searchParams;
  const filter = typeof kind === "string" && kind in HubKind ? (kind as HubKind) : undefined;
  const entries = await prisma.hubEntry.findMany({
    where: { startupId: startup.id, kind: filter },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  const tab = (value: HubKind | undefined, label: string) => (
    <Link
      key={label}
      href={value ? `/hub?kind=${value}` : "/hub"}
      className={"rounded-md px-2.5 py-1 text-sm " + (filter === value ? "bg-zinc-100 font-medium dark:bg-zinc-900" : "text-zinc-500 hover:text-zinc-900")}
    >
      {label}
    </Link>
  );

  return (
    <>
      <PageHeader title="Хаб" subtitle="Критичная информация стартапа в одном месте" />

      <form action={createHubEntry} className="mb-8 grid gap-2 rounded-lg motion-safe:animate-fade-up border border-zinc-200 p-4 sm:grid-cols-[8rem_1fr_1fr] xl:grid-cols-[8rem_1fr_1fr_1.5fr_auto] dark:border-zinc-800">
        <select name="kind" defaultValue={filter ?? "LINK"} className={inputCls}>
          {Object.values(HubKind).map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
        </select>
        <input name="title" required placeholder="Название" className={inputCls} />
        <input name="url" placeholder="Ссылка (необязательно)" className={inputCls} />
        <textarea name="body" rows={1} placeholder="Заметка, телефон, email..." className={inputCls + " sm:col-span-2 xl:col-span-1"} />
        <SubmitButton pendingText="Добавляем…"><Plus size={16} /> Добавить</SubmitButton>
      </form>

      <nav className="mb-4 flex flex-wrap gap-1">
        {tab(undefined, "Все")}
        {Object.values(HubKind).map((k) => tab(k, KIND_LABELS[k]))}
      </nav>

      {entries.length ? (
        <ul className="grid gap-x-10 lg:grid-cols-2 2xl:grid-cols-3 [&>li]:border-b [&>li]:border-zinc-100 dark:[&>li]:border-zinc-900">
          {entries.map((e) => <HubEntryRow key={e.id} entry={e} />)}
        </ul>
      ) : (
        <Empty>Пока пусто</Empty>
      )}
    </>
  );
}
