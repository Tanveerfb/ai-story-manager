"use client";

import { useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/layout/Button";
import { MessageBubble } from "@/components/simulation/MessageBubble";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useSimulationSession } from "@/hooks/useSimulationSession";

export function SimulationChat() {
  const messages = useSimulationStore((s) => s.messages);
  const isProcessing = useSimulationStore((s) => s.isProcessing);
  const acceptLastCharacter = useSimulationStore((s) => s.acceptLastCharacter);
  const endSession = useSimulationStore((s) => s.endSession);
  const { send, regenerate } = useSimulationSession();
  const [input, setInput] = useState("");

  const last = messages[messages.length - 1];
  const showActions =
    last && last.role === "character" && !last.accepted && !isProcessing;

  function submit() {
    if (!input.trim() || isProcessing) return;
    send(input);
    setInput("");
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-end">
        <Button
          size="sm"
          variant="secondary"
          outline
          onClick={endSession}
          disabled={messages.length === 0}
        >
          End session
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Speak as your character to begin.
          </p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        {isProcessing ? (
          <p className="self-start text-xs text-muted-foreground">…</p>
        ) : null}
        {showActions ? (
          <div className="flex gap-2 self-start">
            <Button size="sm" variant="success" onClick={acceptLastCharacter}>
              Accept
            </Button>
            <Button size="sm" variant="secondary" outline onClick={regenerate}>
              <RefreshCw className="size-3.5" /> Regenerate
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex gap-2">
        <input
          className="h-10 flex-1 rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={input}
          placeholder="Your line…"
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
