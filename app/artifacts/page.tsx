import { PageWrapper } from "@/components/layout/PageWrapper";
import { ArtifactDashboard } from "@/components/artifacts/ArtifactDashboard";

export const metadata = {
  title: "Artifacts · AI Story Manager",
};

export default function ArtifactsPage() {
  return (
    <PageWrapper className="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Artifacts</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Characters, locations, timeline, factions, and lore — extracted as you
          write. Author edits are locked and never overwritten.
        </p>
      </header>
      <ArtifactDashboard />
    </PageWrapper>
  );
}
