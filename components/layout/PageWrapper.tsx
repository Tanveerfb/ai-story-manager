import { cn } from "@/lib/utils";

/** Standard page container — constrains width and applies consistent padding. */
export function PageWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("mx-auto w-full max-w-3xl px-4 py-6 sm:py-10", className)}>
      {children}
    </main>
  );
}
