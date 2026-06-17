"use client";

import { useSimulationStore } from "@/store/useSimulationStore";
import { SimulationSetup } from "@/components/simulation/SimulationSetup";
import { SimulationChat } from "@/components/simulation/SimulationChat";
import { SessionReview } from "@/components/simulation/SessionReview";

/** Switches between setup, live chat, and end-of-session review (plan §11D). */
export function SimulationShell() {
  const phase = useSimulationStore((s) => s.phase);
  if (phase === "setup") return <SimulationSetup />;
  if (phase === "chat") return <SimulationChat />;
  return <SessionReview />;
}
