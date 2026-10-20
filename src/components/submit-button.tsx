"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { buttonCls } from "./ui";

export function SubmitButton({
  children,
  pendingText,
  className = buttonCls,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} aria-busy={pending} className={className + " disabled:cursor-wait disabled:opacity-60"}>
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Кнопка-иконка с формой: показывает спиннер, пока action выполняется.
export function IconAction({
  action,
  fields,
  label,
  icon,
  className = "p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100",
}: {
  action: (form: FormData) => Promise<void>;
  fields: Record<string, string>;
  label: string;
  icon: React.ReactNode;
  className?: string;
}) {
  return (
    <form action={action}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <IconButton label={label} icon={icon} className={className} />
    </form>
  );
}

function IconButton({ label, icon, className }: { label: string; icon: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button aria-label={label} title={label} disabled={pending} className={className}>
      {pending ? <Loader2 size={14} className="animate-spin" /> : icon}
    </button>
  );
}

export function PendingHint({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  if (!pending) return null;
  return <div className="motion-safe:animate-fade-up">{children}</div>;
}
