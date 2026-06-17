"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/layout/Button";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { enabled, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!enabled) {
    return (
      <PageWrapper className="flex min-h-[60vh] flex-col justify-center gap-3">
        <h1 className="text-xl font-semibold">Sign-in is disabled</h1>
        <p className="text-sm text-muted-foreground">
          Authentication is turned off for this app.
        </p>
        <Link href="/story" className="text-sm text-primary underline-offset-4 hover:underline">
          Continue to Story
        </Link>
      </PageWrapper>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace("/story");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  const fieldClass =
    "h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <PageWrapper className="flex min-h-[70vh] max-w-sm flex-col justify-center">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Sign in</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            className={fieldClass}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            className={fieldClass}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" variant="primary" loading={busy} fullWidth>
          Sign in
        </Button>
      </form>
    </PageWrapper>
  );
}
