import type { Citation } from "../../types/brainKnowledge.types";

export const INSUFFICIENT_PREFIX = "Not enough stored information to answer this";
export const DRAFT_LINE = "DRAFT — suggestions only; an engineer must review.";
export const MAX_CITATIONS = 50;

/** Validates server-provided citations: keeps only objects with string id and label, capped. */
export function normalizeCitations(raw: unknown): Citation[] {
  if (!Array.isArray(raw)) return [];
  const out: Citation[] = [];
  for (const item of raw) {
    if (out.length >= MAX_CITATIONS) break;
    if (typeof item !== "object" || item === null) continue;
    const r = item as Record<string, unknown>;
    if (typeof r.id !== "string" || typeof r.label !== "string") continue;
    const c: Citation = { id: r.id, label: r.label };
    if (typeof r.fileName === "string" && r.fileName) c.fileName = r.fileName;
    if (typeof r.page === "number" && Number.isFinite(r.page)) c.page = r.page;
    out.push(c);
  }
  return out;
}

export function isInsufficientReply(text: string): boolean {
  return text.startsWith(INSUFFICIENT_PREFIX);
}

/** lead = first line; rest = remaining non-empty lines. */
export function splitReplyForDisplay(text: string): { lead: string; rest: string[] } {
  const lines = text.split("\n");
  return {
    lead: lines[0] ?? "",
    rest: lines.slice(1).filter((l) => l.trim() !== ""),
  };
}

export function hasDraftLine(text: string): boolean {
  return text.split("\n").some((l) => l.trim() === DRAFT_LINE);
}
