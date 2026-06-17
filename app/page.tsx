import Link from "next/link";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { buttonVariants } from "@/components/layout/Button";

export default function Home() {
  return (
    <PageWrapper className="flex min-h-[60vh] flex-col justify-center">
      <h1 className="text-3xl font-semibold tracking-tight">AI Story Manager</h1>
      <p className="mt-2 max-w-prose text-muted-foreground">
        Local-first, AI-assisted story management. You own every word — the
        assistant only formats and remembers.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link href="/story" className={buttonVariants({ variant: "primary" })}>
          Open story
        </Link>
        <Link
          href="/settings"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Settings
        </Link>
      </div>
    </PageWrapper>
  );
}
