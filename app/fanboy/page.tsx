import { FanboyChat } from "@/components/fanboy/FanboyChat";

export const metadata = {
  title: "Fanboy · AI Story Manager",
};

export default function FanboyPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-4 sm:p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Fan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          An on-demand enthusiast who knows only what you&apos;ve written.
        </p>
      </header>
      <FanboyChat />
    </main>
  );
}
