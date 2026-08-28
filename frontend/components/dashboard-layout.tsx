"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { supabase } from "../lib/supabase/client";
import { DineBellIcon, DineBellWordmark } from "./dinebell-brand";

const navigationItems = [
  { href: "/dashboard", label: "Overview", icon: "◌" },
  { href: "/reservations", label: "Reservations", icon: "▤" },
  { href: "/calendar", label: "Calendar", icon: "□" },
  { href: "/conversations", label: "Conversations", icon: "◒" },
  { href: "/analytics", label: "Analytics", icon: "◫" },
  { href: "/settings", label: "Receptionist settings", icon: "⚙" }
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
    <div className="flex h-full flex-col px-4 py-6 text-[#e9dfd4]">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        aria-label="DineBell dashboard"
        className="flex w-fit items-center px-3 py-2"
      >
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#fffdf9] shadow-[0_8px_18px_rgba(0,0,0,0.18)]">
          <DineBellIcon className="h-8 w-8" priority />
        </span>
      </Link>

      <p className="mt-10 px-3 text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#bfa68c]">
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
                  ? "bg-[#fffaf4] text-[#25211f] shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                  : "text-[#ded1c3] hover:bg-white/10 hover:text-[#fffdf9]")
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
          className="block rounded-xl px-3 py-2 text-sm text-[#bcae9f] transition hover:bg-white/10 hover:text-[#fffdf9]"
        >
          View landing page
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#ded1c3] transition hover:bg-white/10 hover:text-[#fffdf9]"
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
    <div className="dinebell-page min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[#4a4038] bg-[#25211f] lg:block">
        <Navigation />
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e7ddd2] bg-[#fffdf9]/95 px-4 py-3.5 backdrop-blur lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#b59675] text-[#25211f]">
            <DineBellIcon className="h-4.5 w-4.5" />
          </span>
          <DineBellWordmark className="text-xl" />
        </Link>
        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-expanded={isMenuOpen}
          aria-controls="dashboard-navigation"
          className="rounded-lg border border-[#d8ccc0] bg-[#fffdf9] px-3 py-2 text-sm font-medium text-[#25211f] transition hover:border-[#b59675] hover:bg-[#f8f1e9]"
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
            className="absolute inset-0 h-full w-full bg-[#25211f]/55"
          />
          <aside
            id="dashboard-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Restaurant operations navigation"
            className="relative h-full w-72 max-w-[85vw] bg-[#25211f] shadow-2xl"
          >
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[#ded1c3] transition hover:bg-white/10 hover:text-[#fffdf9]"
              >
                Close
              </button>
            </div>
            <Navigation onNavigate={() => setIsMenuOpen(false)} />
          </aside>
        </div>
      )}

      <main className="min-w-0 lg:pl-64">
        <header className="hidden h-[4.5rem] items-center justify-between border-b border-[#e7ddd2] bg-[#fffdf9]/90 px-10 backdrop-blur lg:flex">
          <Link
            href="/dashboard"
            aria-label="DineBell dashboard"
            className="inline-flex transition hover:opacity-75"
          >
            <DineBellWordmark className="text-[1.35rem]" />
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b7e73]">
            Restaurant workspace
          </p>
        </header>
        {children}
      </main>
    </div>
  );
}
