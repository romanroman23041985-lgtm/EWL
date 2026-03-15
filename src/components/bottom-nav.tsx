"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/profile",
    label: "План",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path d="M12 5v14" />
        <path d="M5 12h14" />
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
        <path d="M7 5h10" />
        <path d="M9 5v6" />
        <path d="M15 5v6" />
        <path d="M6 11h12" />
        <path d="M8 19c0-3 1.3-5 4-5s4 2 4 5" />
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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto w-[calc(100%-2rem)] max-w-md rounded-[2rem] border border-white/60 bg-white/92 p-2 shadow-[0_20px_50px_rgba(115,127,132,0.18)] backdrop-blur">
      <ul className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const active = pathname === tab.href;

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex min-h-14 flex-col items-center justify-center rounded-[1.35rem] px-2 py-2 text-[11px] font-semibold transition ${
                  active
                    ? "bg-[var(--color-accent)] text-white shadow-[0_14px_28px_rgba(239,93,141,0.36)]"
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
