"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/layout/Button";
import { useSettingsStore } from "@/store/useSettingsStore";
import { PROVIDER_DEFAULTS } from "@/lib/constants";
import type { HealthCheckResult, LLMProvider } from "@/types/llm";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

/**
 * Build the option list for a model select: the models reported by the last
 * successful connection test, plus the currently-saved value (so a persisted
 * choice still shows after reload, before the connection is re-tested).
 */
function modelOptions(available: string[], current: string): string[] {
  return Array.from(new Set([...available, current].filter(Boolean)));
}

export function SettingsForm() {
  const {
    provider,
    baseUrl,
    generationModel,
    embeddingModel,
    availableModels,
    connectionState,
    connectionError,
    setProvider,
    setBaseUrl,
    setGenerationModel,
    setEmbeddingModel,
    setAvailableModels,
    setConnectionState,
  } = useSettingsStore();

  async function testConnection() {
    setConnectionState("testing");
    setAvailableModels([]);
    try {
      const res = await fetch("/api/llm/health", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, baseUrl }),
      });
      const result = (await res.json()) as HealthCheckResult;
      if (result.ok) {
        setAvailableModels(result.models ?? []);
        setConnectionState("success");
      } else {
        setConnectionState("error", result.error ?? "Connection failed");
      }
    } catch (error) {
      setConnectionState(
        "error",
        error instanceof Error ? error.message : "Connection failed",
      );
    }
  }

  const genOptions = modelOptions(availableModels, generationModel);
  const embedOptions = modelOptions(availableModels, embeddingModel);
  const noModels = availableModels.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <Field label="Provider" hint="Both expose an OpenAI-compatible local API.">
        <select
          className={fieldClass}
          value={provider}
          onChange={(e) => setProvider(e.target.value as LLMProvider)}
        >
          {(Object.keys(PROVIDER_DEFAULTS) as LLMProvider[]).map((p) => (
            <option key={p} value={p}>
              {PROVIDER_DEFAULTS[p].label}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Base URL"
        hint={`Default for ${PROVIDER_DEFAULTS[provider].label}: ${PROVIDER_DEFAULTS[provider].baseUrl}`}
      >
        <input
          className={fieldClass}
          type="url"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder={PROVIDER_DEFAULTS[provider].baseUrl}
        />
      </Field>

      <Field
        label="Generation model"
        hint={
          noModels
            ? "Test the connection to load the provider's models."
            : "Pick from the models the provider has loaded."
        }
      >
        <select
          className={fieldClass}
          value={generationModel}
          disabled={genOptions.length === 0}
          onChange={(e) => setGenerationModel(e.target.value)}
        >
          <option value="" disabled>
            {genOptions.length === 0 ? "No models loaded" : "Select a model"}
          </option>
          {genOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Embedding model"
        hint={
          noModels
            ? "Test the connection to load the provider's models."
            : "Pick from the models the provider has loaded."
        }
      >
        <select
          className={fieldClass}
          value={embeddingModel}
          disabled={embedOptions.length === 0}
          onChange={(e) => setEmbeddingModel(e.target.value)}
        >
          <option value="" disabled>
            {embedOptions.length === 0 ? "No models loaded" : "Select a model"}
          </option>
          {embedOptions.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </Field>

      <div className="flex flex-col gap-3">
        <Button
          variant="primary"
          onClick={testConnection}
          loading={connectionState === "testing"}
          className="sm:w-fit"
        >
          Test connection
        </Button>

        {connectionState === "success" ? (
          <ConnectionBanner ok models={availableModels} />
        ) : null}
        {connectionState === "error" ? (
          <ConnectionBanner ok={false} error={connectionError} />
        ) : null}
      </div>
    </div>
  );
}

function ConnectionBanner({
  ok,
  models,
  error,
}: {
  ok: boolean;
  models?: string[];
  error?: string | null;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border p-3 text-sm",
        ok
          ? "border-success/40 text-success"
          : "border-destructive/40 text-destructive",
      )}
      role="status"
    >
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      <div className="flex flex-col gap-1">
        {ok ? (
          <>
            <span>Connected.</span>
            {models && models.length > 0 ? (
              <span className="text-muted-foreground">
                {models.length} model{models.length === 1 ? "" : "s"} available:{" "}
                {models.slice(0, 6).join(", ")}
                {models.length > 6 ? "…" : ""}
              </span>
            ) : null}
          </>
        ) : (
          <span className="break-words">{error}</span>
        )}
      </div>
    </div>
  );
}
