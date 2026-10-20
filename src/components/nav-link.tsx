"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const active = usePathname().startsWith(href);

  return (
    <Link
      href={href}
      className={
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors " +
        (active
          ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
          : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100")
      }
    >
      {children}
    </Link>
  );
}
