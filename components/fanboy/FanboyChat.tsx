"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/layout/Button";
import { useFanboyStore } from "@/store/useFanboyStore";
import { useFanboy } from "@/hooks/useFanboy";
import { cn } from "@/lib/utils";

export function FanboyChat() {
  const messages = useFanboyStore((s) => s.messages);
  const personality = useFanboyStore((s) => s.personality);
  const isProcessing = useFanboyStore((s) => s.isProcessing);
  const { send } = useFanboy();
  const [input, setInput] = useState("");

  function submit() {
    if (!input.trim() || isProcessing) return;
    send(input);
    setInput("");
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {personality ? (
        <p className="rounded-md border border-accent/30 bg-card px-3 py-2 text-xs text-muted-foreground">
          <span className="text-accent">Fan:</span> {personality}
        </p>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chat with an enthusiastic fan of your story. They react and ask
            questions — they never predict, spoil, or add to it.
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] rounded-md px-3 py-2 text-sm",
                m.role === "user"
                  ? "self-end bg-primary text-primary-foreground"
                  : "self-start border border-border bg-card",
              )}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          ))
        )}
        {isProcessing ? (
          <p className="self-start text-xs text-muted-foreground">thinking…</p>
        ) : null}
      </div>

      <div className="flex gap-2">
        <input
          className="h-10 flex-1 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={input}
          placeholder="Ask the fan something…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <Button variant="primary" disabled={isProcessing} onClick={submit}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
