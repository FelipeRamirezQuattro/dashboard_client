import type {
  BrainAccessRole,
  BrainDocumentFlag,
  BrainGroundingMode,
  CategorySettings,
  DocKind,
  DocStatus,
  ImportIssue,
  ImportReportView,
} from "../../types/brainKnowledge.types";

export type BadgeVariant = "neutral" | "accent" | "success" | "info" | "warning" | "danger";

export const MD_MAX_BYTES = 200 * 1024;
export const PDF_MAX_BYTES = 20 * 1024 * 1024;

export const DOC_KINDS: ReadonlyArray<{ value: DocKind; label: string }> = [
  { value: "facts", label: "Facts" },
  { value: "guidance", label: "Guidance" },
  { value: "glossary", label: "Glossary" },
  { value: "procedure", label: "Procedure" },
];

const ACCESS_RANK: Record<BrainAccessRole, number> = { viewer: 0, editor: 1, admin: 2 };

/** Only admins and superadmins may see or reach the Knowledge tab. */
export const isKnowledgeAdminRole = (role: string | undefined | null): boolean =>
  role === "admin" || role === "superadmin";

/** True when every flag key is ticked (a draft with no flags can always be activated). */
export const canActivate = (
  flags: ReadonlyArray<Pick<BrainDocumentFlag, "key">>,
  ticked: ReadonlySet<string> | ReadonlyArray<string>,
): boolean => {
  const set = ticked instanceof Set ? ticked : new Set(ticked as ReadonlyArray<string>);
  return flags.every((flag) => set.has(flag.key));
};

export const hasWarnings = (report: Pick<ImportReportView, "issues">): boolean =>
  report.issues.some((issue) => issue.severity === "warn");

/** Commit is allowed only when the server says so and any warnings have been acknowledged. */
export const canCommit = (report: ImportReportView | null | undefined, ackWarnings: boolean): boolean => {
  if (!report || !report.canCommit) return false;
  return hasWarnings(report) ? ackWarnings : true;
};

export const fileExtension = (name: string): string => {
  const index = name.lastIndexOf(".");
  return index < 0 ? "" : name.slice(index + 1).toLowerCase();
};

/** Returns a friendly message when the file is too big or the wrong type, else null. */
export const fileSizeLimitError = (file: { name: string; size: number }): string | null => {
  const ext = fileExtension(file.name);
  if (ext === "md") {
    return file.size > MD_MAX_BYTES ? "Markdown files must be 200 KB or smaller." : null;
  }
  if (ext === "pdf") {
    return file.size > PDF_MAX_BYTES ? "PDF files must be 20 MB or smaller." : null;
  }
  return "Choose a .md or .pdf file.";
};

/** PDFs need a title and kind; Markdown can take them from front matter. */
export const uploadFormError = (
  file: { name: string; size: number } | null,
  title: string,
  kind: string,
): string | null => {
  if (!file) return "Choose a file to upload.";
  const sizeError = fileSizeLimitError(file);
  if (sizeError) return sizeError;
  if (fileExtension(file.name) === "pdf") {
    if (!title.trim()) return "A title is required for PDF files.";
    if (!kind) return "A kind is required for PDF files.";
  }
  return null;
};

export const groupIssuesByFile = (issues: ReadonlyArray<ImportIssue>): Record<string, ImportIssue[]> => {
  const out: Record<string, ImportIssue[]> = {};
  for (const issue of issues) (out[issue.file] ??= []).push(issue);
  return out;
};

export const badgeVariantForStatus = (status: DocStatus): BadgeVariant => {
  if (status === "active") return "success";
  if (status === "draft") return "warning";
  return "neutral";
};

export const badgeVariantForEmbedding = (status: string): BadgeVariant => {
  if (status === "done") return "success";
  if (status === "failed") return "danger";
  if (status === "pending") return "info";
  return "neutral";
};

export const badgeVariantForSeverity = (severity: ImportIssue["severity"]): BadgeVariant =>
  severity === "reject" ? "danger" : "warning";

export const accessRoleBadgeLabel = (role: BrainAccessRole): string | null =>
  role === "admin" ? "Admin only" : role === "editor" ? "Editors+" : null;

export const isLoweringAccess = (current: BrainAccessRole, next: BrainAccessRole): boolean =>
  ACCESS_RANK[next] < ACCESS_RANK[current];

/** Parses the min-evidence input; returns null unless it is an integer from 1 to 10. */
export const parseMinEvidence = (raw: string): number | null => {
  if (!/^\d{1,2}$/.test(raw.trim())) return null;
  const n = Number(raw);
  return n >= 1 && n <= 10 ? n : null;
};

/** Only the fields that differ from the saved settings. */
export const changedSettings = (saved: CategorySettings, draft: CategorySettings): Partial<CategorySettings> => {
  const diff: Partial<CategorySettings> = {};
  if (draft.accessRole !== saved.accessRole) diff.accessRole = draft.accessRole;
  if (draft.groundingMode !== saved.groundingMode) diff.groundingMode = draft.groundingMode;
  if (draft.minEvidenceCount !== saved.minEvidenceCount) diff.minEvidenceCount = draft.minEvidenceCount;
  return diff;
};

export const isSwitchingToStrict = (saved: BrainGroundingMode, next: BrainGroundingMode): boolean =>
  saved !== "strict" && next === "strict";

export const totalPages = (total: number, pageSize: number): number =>
  Math.max(1, Math.ceil(total / pageSize));
