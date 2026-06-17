"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

/**
 * Route guard (plan §Batch9). When auth is disabled it renders children
 * unchanged. When enabled, unauthenticated users are redirected to /login.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { enabled, user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!enabled || isLoading) return;
    if (!user && pathname !== "/login") router.replace("/login");
  }, [enabled, user, isLoading, pathname, router]);

  if (!enabled) return <>{children}</>;
  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user && pathname !== "/login") return null;
  return <>{children}</>;
}
