import type { Location } from "@/types/artifacts";

export function LocationCard({ location }: { location: Location }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <h3 className="font-medium">{location.name}</h3>
      {location.description ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {location.description}
        </p>
      ) : null}
    </div>
  );
}
