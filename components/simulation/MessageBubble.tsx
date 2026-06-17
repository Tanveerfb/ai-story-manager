import type { SimulationMessage } from "@/types/simulation";
import { cn } from "@/lib/utils";

export function MessageBubble({ message }: { message: SimulationMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn(
        "max-w-[85%] rounded-md px-3 py-2 text-sm",
        isUser
          ? "self-end bg-primary text-primary-foreground"
          : "self-start border border-border bg-card",
      )}
    >
      <p className="mb-0.5 text-xs opacity-70">{message.speaker}</p>
      <p className="whitespace-pre-wrap">{message.content}</p>
    </div>
  );
}
