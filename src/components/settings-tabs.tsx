"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/settings", label: "Проект" },
  { href: "/settings/integrations", label: "Интеграции" },
];

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={
            "-mb-px border-b-2 px-3 py-2 text-sm transition-colors " +
            (pathname === href
              ? "border-indigo-600 font-medium text-zinc-900 dark:text-zinc-100"
              : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100")
          }
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
