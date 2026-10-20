import { CheckCircle2, Circle, Sparkles, Trash2 } from "lucide-react";
import { deleteItem, toggleItem } from "@/app/actions";
import type { RoadmapItem } from "@/generated/prisma/client";

export function RoadmapItemRow({ item, removable = false }: { item: RoadmapItem; removable?: boolean }) {
  const Icon = item.doneAt ? CheckCircle2 : Circle;

  return (
    <li className="group flex items-start gap-3 py-2">
      <form action={toggleItem}>
        <input type="hidden" name="id" value={item.id} />
        <button
          aria-label={item.doneAt ? "Отметить невыполненной" : "Отметить выполненной"}
          className={"mt-0.5 " + (item.doneAt ? "text-indigo-600" : "text-zinc-300 hover:text-zinc-500")}
        >
          <Icon size={18} />
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p className={"text-sm " + (item.doneAt ? "text-zinc-400 line-through" : "")}>
          {item.title}
          {item.source === "AI" ? (
            <Sparkles size={12} className="ml-1.5 inline text-zinc-300" aria-label="Сгенерировано AI" />
          ) : null}
        </p>
        {item.description ? <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p> : null}
      </div>
      {removable ? (
        <form action={deleteItem} className="opacity-0 transition-opacity group-hover:opacity-100">
          <input type="hidden" name="id" value={item.id} />
          <button aria-label="Удалить" className="text-zinc-400 hover:text-red-600">
            <Trash2 size={14} />
          </button>
        </form>
      ) : null}
    </li>
  );
}
