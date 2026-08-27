"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { supabase } from "../lib/supabase/client";

const navigationItems = [
  { href: "/dashboard", label: "Overview", icon: "◌" },
  { href: "/reservations", label: "Reservations", icon: "▤" },
  { href: "/calendar", label: "Calendar", icon: "□" },
  { href: "/conversations", label: "Conversations", icon: "◒" },
  { href: "/analytics", label: "Analytics", icon: "◫" },
  { href: "/settings", label: "AI Settings", icon: "⚙" }
];

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavigationProps {
  onNavigate?: () => void;
}

function Navigation({ onNavigate }: NavigationProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="flex h-full flex-col px-4 py-5 text-stone-200">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 px-3 py-2 text-sm font-semibold tracking-tight text-white"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-300 text-sm font-bold text-stone-950">
          A
        </span>
        AI Employee
      </Link>

      <p className="mt-9 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
        Restaurant operations
      </p>
      <nav aria-label="Restaurant operations" className="mt-3 space-y-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition " +
                (isActive
                  ? "bg-white text-stone-950 shadow-sm"
                  : "text-stone-300 hover:bg-white/10 hover:text-white")
              }
            >
              <span aria-hidden="true" className="w-4 text-center text-base leading-none">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="block rounded-xl px-3 py-2 text-sm text-stone-400 transition hover:bg-white/10 hover:text-white"
        >
          View landing page
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-stone-300 transition hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-stone-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-stone-950 lg:block">
        <Navigation />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200 bg-[#f7f6f2]/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-stone-950 text-xs text-white">A</span>
          AI Employee
        </Link>
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-expanded={isMenuOpen}
          aria-controls="dashboard-navigation"
          className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium transition hover:bg-stone-50"
        >
          Menu
        </button>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 h-full w-full bg-stone-950/45"
          />
          <aside
            id="dashboard-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Restaurant operations navigation"
            className="relative h-full w-72 max-w-[85vw] bg-stone-950 shadow-2xl"
          >
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-stone-300 transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
            <Navigation onNavigate={() => setIsMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main className="min-w-0 lg:pl-64">{children}</main>
    </div>
  );
}
