import { FileText, Link2, Pin, PinOff, StickyNote, Trash2, User } from "lucide-react";
import { deleteHubEntry, toggleHubPin } from "@/app/actions";
import type { HubEntry } from "@/generated/prisma/client";
import { brandFor } from "@/lib/brand";
import { BrandIcon } from "./brand-icon";

const KIND_ICONS = { LINK: Link2, NOTE: StickyNote, CONTACT: User, DOC: FileText };

export function HubEntryRow({ entry, actions = true }: { entry: HubEntry; actions?: boolean }) {
  const brand = brandFor(entry.url);
  const KindIcon = KIND_ICONS[entry.kind];

  return (
    <li className="group flex items-start gap-3 py-2.5">
      <span className="mt-0.5 shrink-0 text-zinc-400">
        {brand ? <BrandIcon icon={brand} /> : <KindIcon size={16} />}
      </span>
      <div className="min-w-0 flex-1">
        {entry.url ? (
          <a href={entry.url} target="_blank" rel="noreferrer" className="text-sm hover:underline">
            {entry.title}
          </a>
        ) : (
          <p className="text-sm">{entry.title}</p>
        )}
        {entry.body ? <p className="mt-0.5 whitespace-pre-line text-xs text-zinc-500">{entry.body}</p> : null}
      </div>
      {actions ? (
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <form action={toggleHubPin}>
            <input type="hidden" name="id" value={entry.id} />
            <button aria-label={entry.pinned ? "Открепить" : "Закрепить"} className="p-1 text-zinc-400 hover:text-zinc-900">
              {entry.pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
          </form>
          <form action={deleteHubEntry}>
            <input type="hidden" name="id" value={entry.id} />
            <button aria-label="Удалить" className="p-1 text-zinc-400 hover:text-red-600">
              <Trash2 size={14} />
            </button>
          </form>
        </div>
      ) : entry.pinned ? (
        <Pin size={12} className="mt-1 text-zinc-300" />
      ) : null}
    </li>
  );
}
