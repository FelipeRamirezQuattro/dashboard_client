import type { Citation } from "../../types/brainKnowledge.types";

export const INSUFFICIENT_PREFIX = "Not enough stored information to answer this";
export const DRAFT_LINE = "DRAFT — suggestions only; an engineer must review.";
export const MAX_CITATIONS = 50;

const MAX_TEXT = 200;
const clip = (v: string) => (v.length > MAX_TEXT ? `${v.slice(0, MAX_TEXT - 1)}…` : v);

/**
 * Validates server-provided citations, all-or-nothing: any invalid item or an
 * array over the cap yields [] so [n] numbering can never drift from the reply.
 */
export function normalizeCitations(raw: unknown): Citation[] {
  if (!Array.isArray(raw) || raw.length > MAX_CITATIONS) return [];
  const out: Citation[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return [];
    const r = item as Record<string, unknown>;
    if (typeof r.id !== "string" || r.id === "") return [];
    if (typeof r.label !== "string" || r.label === "") return [];
    const c: Citation = { id: r.id, label: clip(r.label) };
    if (typeof r.fileName === "string" && r.fileName) c.fileName = clip(r.fileName);
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
