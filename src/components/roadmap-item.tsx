"use client";

import { useOptimistic } from "react";
import { CheckCircle2, Circle, Sparkles, Trash2 } from "lucide-react";
import { deleteItem, toggleItem } from "@/app/actions";
import type { RoadmapItem } from "@/generated/prisma/client";
import { IconAction } from "./submit-button";

export function RoadmapItemRow({ item, removable = false }: { item: RoadmapItem; removable?: boolean }) {
  const [done, setDone] = useOptimistic(Boolean(item.doneAt));
  const Icon = done ? CheckCircle2 : Circle;

  return (
    <li className="group flex items-start gap-3 py-2 motion-safe:animate-fade-up">
      <form
        action={async (form) => {
          setDone(!done);
          await toggleItem(form);
        }}
      >
        <input type="hidden" name="id" value={item.id} />
        <button
          aria-label={done ? "Отметить невыполненной" : "Отметить выполненной"}
          className={
            "mt-0.5 transition-all duration-200 active:scale-90 " +
            (done ? "text-indigo-600" : "text-zinc-300 hover:text-zinc-500")
          }
        >
          <Icon size={18} className={done ? "motion-safe:animate-[pop_0.25s_ease-out]" : ""} />
        </button>
      </form>
      <div className="min-w-0 flex-1">
        <p className={"text-sm transition-colors duration-300 " + (done ? "text-zinc-400 line-through" : "")}>
          {item.title}
          {item.source === "AI" ? (
            <Sparkles size={12} className="ml-1.5 inline text-zinc-300" aria-label="Сгенерировано AI" />
          ) : null}
        </p>
        {item.description ? <p className="mt-0.5 text-xs text-zinc-500">{item.description}</p> : null}
      </div>
      {removable ? (
        <div className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <IconAction
            action={deleteItem}
            fields={{ id: item.id }}
            label="Удалить"
            icon={<Trash2 size={14} />}
            className="p-1 text-zinc-400 hover:text-red-600"
          />
        </div>
      ) : null}
    </li>
  );
}
