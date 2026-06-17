import { EditorShell } from "@/components/editor/EditorShell";

export const metadata = {
  title: "Editor · AI Story Manager",
};

// Full screen on mobile — no panels or drawers during active writing (plan §13).
export default function EditorPage() {
  return (
    <main className="flex flex-1 flex-col p-4 sm:p-6">
      <EditorShell />
    </main>
  );
}
