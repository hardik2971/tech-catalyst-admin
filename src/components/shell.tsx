"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity, CalendarDays, ChevronDown, ExternalLink, FileQuestion, Handshake, Images, LayoutDashboard, LogOut, Mail, Menu,
  MessageSquareText, Moon, Package, Settings, ShieldCheck, Sun, UserCircle, Users, UsersRound, X, Mic2,
} from "lucide-react";
import { api, cn, initials } from "@/lib/client";
import { can, SessionProvider, useSession } from "./session";

type NavItem = { href: string; label: string; icon: ReactNode; superOnly?: boolean };

const NAV: { title: string; items: NavItem[] }[] = [
  { title: "Overview", items: [{ href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard /> }] },
  {
    title: "Event Management",
    items: [
      { href: "/events", label: "Events", icon: <CalendarDays /> },
      { href: "/gallery", label: "Media Gallery", icon: <Images /> },
      { href: "/speakers", label: "Speakers", icon: <Mic2 /> },
      { href: "/sponsors", label: "Partners & Sponsors", icon: <Handshake /> },
      { href: "/packages", label: "Sponsorship Packages", icon: <Package /> },
      { href: "/faqs", label: "FAQs", icon: <FileQuestion /> },
    ],
  },
  {
    title: "Website Submissions",
    items: [
      { href: "/community", label: "Community Applications", icon: <UsersRound /> },
      { href: "/sponsor-leads", label: "Sponsor Leads", icon: <Handshake /> },
      { href: "/surveys", label: "Survey Responses", icon: <MessageSquareText /> },
      { href: "/subscribers", label: "Gallery Subscribers", icon: <Mail /> },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/settings", label: "Site Settings", icon: <Settings /> },
      { href: "/admins", label: "Admin Users", icon: <ShieldCheck />, superOnly: true },
      { href: "/activity", label: "Activity Log", icon: <Activity /> },
    ],
  },
];

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { me } = useSession();
  return (
    <>
      <div className={cn("fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden", open ? "block" : "hidden")} onClick={onClose} />
      <aside
        className={cn(
          "bg-sidebar fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col text-white transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/TechCatalyst_White.png" alt="Tech Catalyst Summit" className="h-11 w-auto" />
            <div className="leading-tight">
              <div className="font-display text-[17px]">Tech Catalyst</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7fe8e8]">Admin Console</div>
            </div>
          </Link>
          <button className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 lg:hidden" onClick={onClose} aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV.map((group) => (
            <div key={group.title}>
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{group.title}</div>
              <ul className="space-y-0.5">
                {group.items
                  .filter((i) => !i.superOnly || can(me, "super"))
                  .map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition [&_svg]:h-[18px] [&_svg]:w-[18px]",
                            active ? "bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]" : "text-white/65 hover:bg-white/[0.05] hover:text-white",
                          )}
                        >
                          {active && <span className="bg-brand-gradient absolute top-2 bottom-2 left-0 w-[3px] rounded-r-full" />}
                          <span className={cn(active ? "text-[#5ff0f0]" : "text-white/50 group-hover:text-white/80")}>{item.icon}</span>
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </nav>

        {SITE && (
          <div className="border-t border-white/10 px-4 py-4">
            <a
              href={SITE}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs text-white/70 hover:bg-white/[0.08]"
            >
              <span>
                <span className="block font-semibold text-white">View live website</span>
                <span className="text-white/50">{SITE.replace(/^https?:\/\//, "")}</span>
              </span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}
      </aside>
    </>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("tcs-theme", next ? "dark" : "light");
    } catch {}
  };
  return (
    <button onClick={toggle} className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-line bg-surface text-muted hover:text-ink" aria-label="Toggle theme">
      {dark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
    </button>
  );
}

function UserMenu() {
  const { me } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  async function logout() {
    await api.post("/auth/logout").catch(() => {});
    router.replace("/login");
    router.refresh();
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface py-1.5 pr-3 pl-1.5 hover:bg-surface-2">
        <span className="bg-brand-gradient grid h-8 w-8 place-items-center rounded-lg text-xs font-bold text-white">{initials(me?.name)}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[13px] font-semibold text-ink">{me?.name ?? "…"}</span>
          <span className="block text-[11px] capitalize text-muted">{me?.role.replace("_", " ")}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="animate-pop absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="border-b border-line px-4 py-3">
              <div className="text-sm font-semibold text-ink">{me?.name}</div>
              <div className="truncate text-xs text-muted">{me?.email}</div>
            </div>
            <Link href="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface-2">
              <UserCircle className="h-4 w-4 text-muted" /> My profile
            </Link>
            {can(me, "super") && (
              <Link href="/admins" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink hover:bg-surface-2">
                <Users className="h-4 w-4 text-muted" /> Manage admins
              </Link>
            )}
            <button onClick={logout} className="flex w-full cursor-pointer items-center gap-2.5 border-t border-line px-4 py-2.5 text-sm text-danger hover:bg-danger/5">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <SessionProvider>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
            <div className="flex items-center gap-3">
              <button className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-surface lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden text-sm text-muted md:block" suppressHydrationWarning>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] px-4 py-8 sm:px-8">{children}</main>
      </div>
    </SessionProvider>
  );
}
