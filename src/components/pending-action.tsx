import { Check, ExternalLink, X } from "lucide-react";
import { resolvePendingAction } from "@/app/actions";
import type { PendingAction } from "@/generated/prisma/client";
import { SubmitButton } from "./submit-button";
import { buttonCls, ghostCls } from "./ui";

const STATUS = {
  APPROVED: { label: "Выполнено", cls: "text-emerald-600" },
  REJECTED: { label: "Отклонено", cls: "text-zinc-400" },
  FAILED: { label: "Ошибка", cls: "text-red-600" },
};

export function PendingActionRow({ action }: { action: PendingAction }) {
  const payload = action.payload as { body?: string };

  return (
    <div className="space-y-2 py-3 motion-safe:animate-fade-up">
      <p className="text-sm font-medium">{action.title}</p>
      {payload.body ? <p className="line-clamp-4 text-xs whitespace-pre-line text-zinc-500">{payload.body}</p> : null}
      {action.status === "PENDING" ? (
        <div className="flex gap-2">
          {(["approve", "reject"] as const).map((decision) => (
            <form key={decision} action={resolvePendingAction}>
              <input type="hidden" name="id" value={action.id} />
              <input type="hidden" name="decision" value={decision} />
              {decision === "approve" ? (
                <SubmitButton className={buttonCls + " py-1.5 text-xs"} pendingText="Выполняем…"><Check size={14} /> Одобрить</SubmitButton>
              ) : (
                <SubmitButton className={ghostCls + " text-xs"}><X size={14} /> Отклонить</SubmitButton>
              )}
            </form>
          ))}
        </div>
      ) : (
        <p className={"flex items-center gap-2 text-xs " + STATUS[action.status].cls}>
          {STATUS[action.status].label}
          {action.result?.startsWith("https://") ? (
            <a href={action.result} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-zinc-500 hover:underline">
              открыть <ExternalLink size={11} />
            </a>
          ) : action.result ? (
            <span className="text-zinc-500">{action.result}</span>
          ) : null}
        </p>
      )}
    </div>
  );
}
