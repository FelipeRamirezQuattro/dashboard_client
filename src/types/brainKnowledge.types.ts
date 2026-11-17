// Types mirroring the OSI Brain knowledge server contract
// (documents, datasets, imports, citations).

export type BrainAccessRole = "viewer" | "editor" | "admin";
export type BrainGroundingMode = "strict" | "standard";

export type DocKind = "facts" | "guidance" | "glossary" | "procedure";
export type DocStatus = "draft" | "active" | "archived";

export interface BrainDocumentFlag {
  key: string;
  id: string;
  line: number;
  excerpt: string;
  acknowledged: boolean;
}

/** Shape returned by the server's document list / upload / status endpoints (`id`, not `_id`). */
export interface BrainDocument {
  id: string;
  title: string;
  kind: DocKind;
  version?: string;
  status: DocStatus;
  sourceFormat: "md" | "pdf";
  flags: BrainDocumentFlag[];
  chunkCount: number;
  embeddingStatus: "none" | "pending" | "done" | "failed";
  fileBankId?: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface UploadDocumentMeta {
  title?: string;
  kind?: DocKind;
  version?: string;
  source?: string;
}

export interface ImportFileReport {
  rowsRead: number;
  rowsAccepted: number;
  rowsRejected: number;
}

export interface ImportIssue {
  file: string;
  row: number;
  column?: string;
  severity: "reject" | "warn";
  code: string;
  message: string;
}

export interface ImportReportView {
  datasetKey: string;
  datasetVersion: string;
  files: Record<string, ImportFileReport>;
  issues: ImportIssue[];
  canCommit: boolean;
  issueTotal?: number;
  truncated?: boolean;
}

export interface DatasetColumnSummary {
  name: string;
  type: string;
  required?: boolean;
}

export interface DatasetTableSummary {
  name: string;
  file: string;
  required: boolean;
  columns: DatasetColumnSummary[];
}

export interface DatasetDefinitionSummary {
  key: string;
  version: string;
  label: string;
  tables: DatasetTableSummary[];
}

export interface DatasetRecordsPage {
  items: Record<string, unknown>[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface Citation {
  id: string;
  label: string;
  fileName?: string;
  page?: number;
}

export interface CategorySettings {
  accessRole: BrainAccessRole;
  groundingMode: BrainGroundingMode;
  minEvidenceCount: number;
}

export interface ApiErrorInfo {
  status?: number;
  code?: string;
  message: string;
}
