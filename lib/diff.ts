/**
 * Lightweight, honest change summary for the editor's DiffSummary (plan §11).
 * The formatter only polishes grammar/flow, so this reports structural deltas
 * (sentence count, word delta) — never implies added content.
 */

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function countSentences(text: string): number {
  const matches = text.match(/[^.!?]+[.!?]?/g);
  return matches ? matches.filter((s) => s.trim().length > 0).length : 0;
}

export function summarizeChanges(raw: string, formatted: string): string {
  const delta = countWords(formatted) - countWords(raw);
  const sentences = countSentences(formatted);
  const sign = delta > 0 ? `+${delta}` : `${delta}`;
  const wordLabel = Math.abs(delta) === 1 ? "word" : "words";
  const sentenceLabel = sentences === 1 ? "sentence" : "sentences";
  return `Grammar & flow polished · ${sentences} ${sentenceLabel} · ${sign} ${wordLabel} vs your input`;
}
