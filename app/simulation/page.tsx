import { SimulationShell } from "@/components/simulation/SimulationShell";

export const metadata = {
  title: "Simulation · AI Story Manager",
};

// Full screen on mobile (plan §13).
export default function SimulationPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col p-4 sm:p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">Simulation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Talk to your characters. Keep what you like as a new scene.
        </p>
      </header>
      <SimulationShell />
    </main>
  );
}
