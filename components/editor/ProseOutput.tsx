/** Formatted prose draft for review (plan §11). */
export function ProseOutput({ prose }: { prose: string }) {
  return (
    <article className="flex-1 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-card p-4 text-base leading-relaxed">
      {prose}
    </article>
  );
}
