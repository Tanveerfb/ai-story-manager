"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/story", label: "Story" },
  { href: "/editor", label: "Editor" },
  { href: "/artifacts", label: "Artifacts" },
  { href: "/fanboy", label: "Fan" },
  { href: "/simulation", label: "Simulation" },
  { href: "/settings", label: "Settings" },
];

// Writing surfaces stay distraction-free (plan §13); login has no chrome.
const HIDDEN_ON = ["/editor", "/simulation", "/login"];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { enabled, user, signOut } = useAuth();

  if (HIDDEN_ON.includes(pathname)) return null;

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
        </div>

        {/* Mobile toggle */}
        <button
          className="sm:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
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
