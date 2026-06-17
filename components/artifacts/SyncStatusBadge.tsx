import { cn } from "@/lib/utils";

/** Shows how current the artifacts are relative to approved additions (plan §11). */
export function SyncStatusBadge({
  lastSyncedAddition,
  className,
}: {
  lastSyncedAddition: number | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground",
        className,
      )}
    >
      {lastSyncedAddition
        ? `Synced through addition #${lastSyncedAddition}`
        : "Not yet synced"}
    </span>
  );
}
