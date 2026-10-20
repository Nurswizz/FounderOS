import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireStartup } from "@/lib/session";

export default async function HubEntryPage({ params }: PageProps<"/hub/[id]">) {
  const startup = await requireStartup();
  const { id } = await params;
  const entry = await prisma.hubEntry.findFirst({ where: { id, startupId: startup.id } });
  if (!entry) notFound();

  return (
    <article className="max-w-4xl">
      <Link href="/hub" className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft size={14} /> Хаб
      </Link>
      <PageHeader title={entry.title} subtitle={`Обновлено ${entry.updatedAt.toLocaleString("ru")}`}>
        {entry.url ? (
          <a href={entry.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            Открыть ссылку <ExternalLink size={14} />
          </a>
        ) : null}
      </PageHeader>
      {entry.body ? <Markdown>{entry.body}</Markdown> : <p className="text-sm text-zinc-400">Без текста</p>}
    </article>
  );
}
