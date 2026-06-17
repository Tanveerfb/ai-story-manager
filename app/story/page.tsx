import { PageWrapper } from "@/components/layout/PageWrapper";
import { StoryNavigator } from "@/components/story/StoryNavigator";
import { StoryBiblePanel } from "@/components/story/StoryBiblePanel";

export const metadata = {
  title: "Story · AI Story Manager",
};

export default function StoryPage() {
  return (
    <PageWrapper className="max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Story</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Navigate parts, chapters, and approved additions.
        </p>
      </header>
      <StoryBiblePanel />
      <StoryNavigator />
    </PageWrapper>
  );
}
