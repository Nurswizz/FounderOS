import { BarChart3, LayoutDashboard, Layers, LogOut, Map, Plug } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { NavLink } from "@/components/nav-link";
import { ghostCls } from "@/components/ui";
import { requireStartup } from "@/lib/session";

const NAV = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/roadmap", label: "Роадмап", icon: Map },
  { href: "/hub", label: "Хаб", icon: Layers },
  { href: "/metrics", label: "Метрики", icon: BarChart3 },
  { href: "/settings/integrations", label: "Интеграции", icon: Plug },
];

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const startup = await requireStartup();

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 border-zinc-200 p-4 md:w-56 md:border-r md:py-8 dark:border-zinc-800">
        <div className="px-2.5">
          <p className="text-xs text-zinc-400">FounderOS</p>
          <p className="truncate text-sm font-medium">{startup.name}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {NAV.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href}>
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <form action={signOutAction} className="mt-auto hidden md:block">
          <button className={ghostCls}>
            <LogOut size={16} /> Выйти
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-8 md:px-10">{children}</main>
    </div>
  );
}
