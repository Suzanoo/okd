"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

import { APP_LOGO, APP_NAME } from "@/config/app.config";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "./ThemeToggle";

const publicNav = [
  { href: "/", label: "HOME" },
  { href: "/media", label: "MEDIA" },
  { href: "/contact", label: "CONTACT" },
];

const stakeholderNav = [
  { href: "/boq", label: "BOQ" },
  { href: "/report", label: "REPORT" },
  { href: "/media", label: "MEDIA" },
];

type Props = {
  user: User | null;
  isAdmin: boolean;
};

export default function AppHeaderClient({ user }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const prevPathRef = useRef<string | null>(null);

  const nav = useMemo(() => (user ? stakeholderNav : publicNav), [user]);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;

    if (prev !== null && prev !== pathname && open) setOpen(false);
  }, [pathname, open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => firstLinkRef.current?.focus());

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="sticky top-0 z-50 bg-black/35 pt-[env(safe-area-inset-top)] text-white backdrop-blur-xl supports-[backdrop-filter]:bg-black/25">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        <Link
          href="/"
          aria-label="Go to Home"
          className="inline-flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <Image
            src={APP_LOGO}
            alt={APP_NAME}
            width={48}
            height={48}
            className="rounded-full bg-white/10 p-1 ring-1 ring-white/15 object-contain"
            priority
          />
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">
            {APP_NAME} CM
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {nav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "text-sm font-semibold transition",
                  active ? "text-white" : "text-white/70 hover:text-white",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          <a
            href="https://www.okmd.or.th/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/15 hover:text-white"
          >
            OKMD Website
            <ExternalLink className="h-4 w-4" />
          </a>
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <span className="max-w-[180px] truncate text-xs text-white/55">
                {user.email}
              </span>
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/boq"
              className="hidden rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white/85 transition hover:bg-white/15 hover:text-white md:inline-flex"
            >
              Login
            </Link>
          )}

          <button
            ref={menuBtnRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 p-2 text-white/90 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/25 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-drawer"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <ThemeToggle />
        </div>
      </div>

      <div
        className={[
          "md:hidden",
          open ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className={[
            "fixed inset-0 z-40 bg-black/70 backdrop-blur-[4px] transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          ].join(" ")}
          aria-label="Close menu overlay"
          tabIndex={open ? 0 : -1}
        />

        <aside
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          className={[
            "fixed right-0 top-0 z-50 h-dvh w-[85vw] max-w-xs pt-[env(safe-area-inset-top)]",
            "border-l border-white/15 bg-gradient-to-b from-zinc-900/95 to-black/95 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl",
            "transition-transform duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]",
            open ? "translate-x-0" : "translate-x-full",
          ].join(" ")}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Image
                src={APP_LOGO}
                alt={APP_NAME}
                width={38}
                height={38}
                className="rounded-full bg-white/10 p-1 object-contain"
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold">{APP_NAME} CM</div>
                <div className="truncate text-xs text-white/50">
                  {user ? user.email : "Public"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-white/15 bg-white/10 p-2 text-white/90 transition hover:bg-white/15"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex h-[calc(100dvh-76px-env(safe-area-inset-top))] flex-col px-3 py-3">
            <ul className="flex flex-col gap-1">
              {nav.map((item, idx) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      ref={idx === 0 ? firstLinkRef : undefined}
                      className={[
                        "flex items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-white/20",
                        active
                          ? "bg-white/14 text-white"
                          : "bg-white/[0.03] text-white/85 hover:bg-white/10 hover:text-white",
                      ].join(" ")}
                    >
                      <span>{item.label}</span>
                      {active ? (
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-2">
              <a
                href="https://www.okmd.or.th/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                <span>OKMD Website</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="flex-1" />

            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              {user ? (
                <LogoutButton
                  variant="drawer"
                  onAfterLogout={() => setOpen(false)}
                />
              ) : (
                <Link
                  href="/boq"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  Stakeholder login
                </Link>
              )}
            </div>
          </nav>
        </aside>
      </div>
    </header>
  );
}
