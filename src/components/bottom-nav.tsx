"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/profile",
    label: "Профиль",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
  {
    href: "/plan",
    label: "День",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M5 6.5h14" />
        <path d="M5 12h14" />
        <path d="M5 17.5h10" />
      </svg>
    ),
  },
  {
    href: "/products",
    label: "Продукты",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M12 7c1.4-1.8 3.1-3 5.4-3" strokeLinecap="round" />
        <path d="M12.2 6.4c-.9-1.8-2.4-2.9-4.7-3.2" strokeLinecap="round" />
        <path
          d="M12 8c-4.4 0-7 3-7 6.7 0 3.1 2.2 5.8 5.5 5.8 1 0 1.7-.3 2.5-.8.8.5 1.5.8 2.5.8 3.3 0 5.5-2.7 5.5-5.8C21 11 18.4 8 14 8Z"
          strokeLinejoin="round"
        />
        <path d="M12 8c-.8 1.1-1.2 2.4-1.2 3.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "Календарь",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
        <rect x="4" y="5" width="16" height="15" rx="4" />
        <path d="M8 3v4" />
        <path d="M16 3v4" />
        <path d="M4 10h16" />
      </svg>
    ),
  },
];

function normalizePathname(pathname: string) {
  const withoutBase = pathname.replace(/^\/EWL(?=\/|$)/, "");
  const normalized = withoutBase || "/";
  return normalized.endsWith("/") && normalized !== "/" ? normalized.slice(0, -1) : normalized;
}

export function BottomNav() {
  const pathname = usePathname();
  const currentPath = normalizePathname(pathname);

  return (
    <nav className="theme-nav fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto w-[calc(100%-2rem)] max-w-md rounded-[2rem] p-2 backdrop-blur">
      <ul className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const active = currentPath === tab.href || currentPath.startsWith(`${tab.href}/`);

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`relative flex min-h-14 flex-col items-center justify-center rounded-[1.35rem] px-2 py-2 text-[11px] font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-shell)] ${
                  active
                    ? "theme-switcher-tab-active scale-[1.02] text-white shadow-[var(--shadow-accent)]"
                    : "text-slate-600"
                }`}
              >
                {tab.icon}
                <span className="mt-1">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
