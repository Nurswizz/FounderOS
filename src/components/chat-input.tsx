"use client";

import { useRef } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

function SendButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      aria-label="Отправить"
      disabled={disabled || pending}
      className="grid size-9 shrink-0 place-items-center rounded-md bg-zinc-900 text-white transition-colors hover:bg-zinc-700 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
    </button>
  );
}

export function ChatInput({
  action,
  disabled,
  placeholder,
}: {
  action: (form: FormData) => Promise<void>;
  disabled: boolean;
  placeholder: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (form) => {
        formRef.current?.reset();
        await action(form);
      }}
      className="flex items-end gap-2 rounded-lg border border-zinc-200 p-2 focus-within:border-zinc-400 dark:border-zinc-800 dark:focus-within:border-zinc-600"
    >
      <textarea
        name="text"
        required
        rows={2}
        disabled={disabled}
        placeholder={placeholder}
        onKeyDown={(e) => {
          // Enter — отправить, Shift+Enter — перенос строки.
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            formRef.current?.requestSubmit();
          }
        }}
        className="max-h-48 min-h-10 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-zinc-400 disabled:opacity-50"
      />
      <SendButton disabled={disabled} />
    </form>
  );
}

export function ScrollAnchor({ dep }: { dep: string }) {
  return <div ref={(el) => { if (dep) el?.scrollIntoView({ block: "end" }); }} />;
}
