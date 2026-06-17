/**
 * LLM response parsing + Zod validation (plan §5/§10).
 * Local models sometimes wrap JSON in prose or markdown fences, so we extract
 * the first JSON object/array before validating against a schema.
 */

import { z } from "zod";

/** Strip markdown fences and isolate the first JSON object/array in a string. */
export function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();

  const firstObj = candidate.indexOf("{");
  const firstArr = candidate.indexOf("[");
  const starts = [firstObj, firstArr].filter((i) => i >= 0);
  if (starts.length === 0) return candidate;

  const start = Math.min(...starts);
  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  const end = candidate.lastIndexOf(close);
  if (end <= start) return candidate;
  return candidate.slice(start, end + 1);
}

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Parse an LLM response into a schema-validated value.
 * Returns a discriminated result rather than throwing so callers can implement
 * the "retry once, then flag failed" policy (plan §12).
 */
export function parseValidated<T>(
  raw: string,
  schema: z.ZodType<T>,
): ParseResult<T> {
  let json: unknown;
  try {
    json = JSON.parse(extractJson(raw));
  } catch {
    return { ok: false, error: "Response was not valid JSON" };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true, data: result.data };
}
