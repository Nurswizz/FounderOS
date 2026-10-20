import {
  Briefcase,
  CheckCircle2,
  Clock,
  Code2,
  Loader2,
  MessagesSquare,
  Telescope,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { AgentKey, RunStatus } from "@/generated/prisma/enums";

export const AGENT_ICONS: Record<AgentKey, LucideIcon> = {
  CHIEF_OF_STAFF: Briefcase,
  MARKET_RESEARCHER: Telescope,
  CUSTOMER_DISCOVERY: MessagesSquare,
  CTO: Code2,
};

export function AgentAvatar({ agent, size = "md" }: { agent: AgentKey; size?: "sm" | "md" }) {
  const Icon = AGENT_ICONS[agent];
  return (
    <span
      className={
        "grid shrink-0 place-items-center rounded-md border border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-300 " +
        (size === "sm" ? "size-7" : "size-10")
      }
    >
      <Icon size={size === "sm" ? 14 : 18} />
    </span>
  );
}

const STATUS: Record<RunStatus, { label: string; icon: LucideIcon; cls: string }> = {
  QUEUED: { label: "В очереди", icon: Clock, cls: "text-zinc-500" },
  RUNNING: { label: "Работает", icon: Loader2, cls: "text-indigo-600" },
  DONE: { label: "Готово", icon: CheckCircle2, cls: "text-emerald-600" },
  FAILED: { label: "Ошибка", icon: XCircle, cls: "text-red-600" },
};

export function RunStatusBadge({ status }: { status: RunStatus }) {
  const { label, icon: Icon, cls } = STATUS[status];
  return (
    <span className={"inline-flex items-center gap-1.5 text-xs font-medium " + cls}>
      <Icon size={13} className={status === "RUNNING" ? "animate-spin" : ""} />
      {label}
    </span>
  );
}

const TRIGGERS = { MANUAL: "вручную", SCHEDULE: "по расписанию", DELEGATED: "от Chief of Staff" };
export const triggerLabel = (t: keyof typeof TRIGGERS) => TRIGGERS[t];

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return m ? `${m} мин ${seconds % 60} с` : `${seconds} с`;
}

// Живой статус агента: пульсирующая точка и текущее действие.
export function LiveActivity({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={"flex min-w-0 items-center gap-2 text-indigo-600 " + className}>
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-500 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-indigo-600" />
      </span>
      <span className="truncate">{text}</span>
    </span>
  );
}

const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "auto" });
export function timeAgo(date: Date) {
  const sec = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, s] of units) if (Math.abs(sec) >= s) return rtf.format(Math.round(sec / s), unit);
  return "только что";
}
