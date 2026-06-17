"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { EyeOff, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/story", label: "Story" },
  { href: "/editor", label: "Editor" },
  { href: "/artifacts", label: "Artifacts" },
  { href: "/fanboy", label: "Fan" },
  { href: "/simulation", label: "Simulation" },
  { href: "/settings", label: "Settings" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { enabled, user, signOut } = useAuth();
  const navbarHidden = useUIStore((s) => s.navbarHidden);
  const hideNavbar = useUIStore((s) => s.setNavbarHidden);

  // The bar is ever-present across routes; the author hides it explicitly and
  // restores it via the draggable floating toggle.
  if (navbarHidden) return null;

  const linkClass = (href: string) =>
    cn(
      "rounded-md px-2 py-1 text-sm transition-colors hover:text-foreground",
      pathname === href ? "text-foreground font-medium" : "text-muted-foreground",
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          AI Story Manager
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
          {enabled && user ? (
            <button
              onClick={() => signOut()}
              className="ml-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          ) : null}
          <button
            onClick={() => hideNavbar(true)}
            className="ml-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Hide navigation"
            title="Hide navigation"
          >
            <EyeOff className="size-4" />
          </button>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 sm:hidden">
          <button
            onClick={() => hideNavbar(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Hide navigation"
            title="Hide navigation"
          >
            <EyeOff className="size-5" />
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {open ? (
        <div className="flex flex-col gap-1 border-t border-border px-4 py-2 sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(linkClass(l.href), "py-2")}
            >
              {l.label}
            </Link>
          ))}
          {enabled && user ? (
            <button
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="py-2 text-left text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
