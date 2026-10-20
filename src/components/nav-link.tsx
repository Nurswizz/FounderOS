"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

function PendingDot() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={"ml-auto size-1.5 rounded-full bg-indigo-600 transition-opacity " + (pending ? "animate-pulse opacity-100" : "opacity-0")}
    />
  );
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const active = usePathname().startsWith(href);

  return (
    <Link
      href={href}
      className={
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors " +
        (active
          ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-100")
      }
    >
      {children}
      <PendingDot />
    </Link>
  );
}
