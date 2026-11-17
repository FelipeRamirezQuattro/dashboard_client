import axios from "axios";
import api from "./api";
import type {
  ApiErrorInfo,
  BrainAccessRole,
  BrainDocument,
  BrainGroundingMode,
  CategorySettings,
  DatasetDefinitionSummary,
  DatasetRecordsPage,
  DocStatus,
  ImportReportView,
  UploadDocumentMeta,
} from "../types/brainKnowledge.types";

export type WorkflowBrainDomain =
  | "gas_separation"
  | "chemical_treatment"
  | "sand_filtration"
  | "sales_engineering"
  | "proposals"
  | "field_service"
  | "manufacturing"
  | "qa_qc"
  | "customer_support"
  | "general";

export interface WorkflowBrainCategory {
  _id: string;
  name: string;
  description: string;
  domain: WorkflowBrainDomain;
  isActive: boolean;
  // Optional: legacy categories may lack them (server treats missing as viewer/standard/2).
  accessRole?: BrainAccessRole;
  groundingMode?: BrainGroundingMode;
  minEvidenceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const effectiveAccessRole = (c: Pick<WorkflowBrainCategory, "accessRole">): BrainAccessRole =>
  c.accessRole ?? "viewer";

export const effectiveGroundingMode = (
  c: Pick<WorkflowBrainCategory, "groundingMode">,
): BrainGroundingMode => c.groundingMode ?? "standard";

export const effectiveMinEvidenceCount = (
  c: Pick<WorkflowBrainCategory, "minEvidenceCount">,
): number => c.minEvidenceCount ?? 2;

/** Normalises any thrown value into a safe, displayable error (never raw HTML or stack text). */
export const extractApiError = (err: unknown): ApiErrorInfo => {
  const fallback = "Something went wrong. Please try again.";
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data: unknown = err.response?.data;
    if (data && typeof data === "object") {
      const { error, code } = data as { error?: unknown; code?: unknown };
      return {
        status,
        code: typeof code === "string" ? code : undefined,
        message: typeof error === "string" && error.trim() ? error : fallback,
      };
    }
    if (!err.response) return { message: "Network error. Check your connection and try again." };
    return { status, message: fallback };
  }
  return { message: fallback };
};

export interface BrainMemory {
  _id: string;
  categoryId: string;
  content: string;
  summary: string;
  type: "memory_fact" | "analyzed_note" | "design_request" | "system_event";
  source: "memory" | "workflow" | "design" | "system";
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

export interface BrainEntity {
  _id: string;
  name: string;
  type: string;
  description: string;
}

export interface BrainWorkflowStep {
  _id: string;
  name: string;
  description: string;
  position: number;
  status: "active" | "unclear" | "risky" | "optimized";
}

export interface BrainWorkflowEdge {
  _id: string;
  fromStepId: string;
  toStepId: string;
  label: string;
}

export interface BrainInsight {
  _id: string;
  type: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  confidence: number;
}

export interface BrainUnknownArea {
  _id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  suggestedQuestion: string;
  status: "open" | "answered";
}

export interface BrainDesignOutput {
  _id: string;
  title: string;
  request: string;
  answer: string;
  assumptions: string[];
  requiredInputs: string[];
  risks: string[];
  recommendedNextSteps: string[];
  relatedEntities: string[];
  createdAt: string;
}

export interface WorkflowBrainState {
  category: WorkflowBrainCategory;
  memories: BrainMemory[];
  entities: BrainEntity[];
  workflowSteps: BrainWorkflowStep[];
  workflowEdges: BrainWorkflowEdge[];
  insights: BrainInsight[];
  unknownAreas: BrainUnknownArea[];
  designOutputs: BrainDesignOutput[];
}

export const workflowBrainService = {
  async getCategories(): Promise<WorkflowBrainCategory[]> {
    const response = await api.get("/workflow-brain/categories");
    return Array.isArray(response.data) ? response.data : [];
  },

  async createCategory(data: {
    name: string;
    description?: string;
    domain?: WorkflowBrainDomain;
  }): Promise<WorkflowBrainCategory> {
    const response = await api.post("/workflow-brain/categories", data);
    return response.data;
  },

  async getState(categoryId: string): Promise<WorkflowBrainState> {
    const response = await api.get(`/workflow-brain/categories/${categoryId}/state`);
    return response.data;
  },

  async addMemory(categoryId: string, content: string): Promise<BrainMemory> {
    const response = await api.post(`/workflow-brain/categories/${categoryId}/memory`, {
      content,
    });
    return response.data;
  },

  async updateMemory(memoryId: string, content: string): Promise<BrainMemory> {
    const response = await api.patch(`/workflow-brain/memory/${memoryId}`, {
      content,
    });
    return response.data;
  },

  async deleteMemory(memoryId: string): Promise<void> {
    await api.delete(`/workflow-brain/memory/${memoryId}`);
  },

  async analyzeNote(categoryId: string, note: string): Promise<WorkflowBrainState> {
    const response = await api.post(
      `/workflow-brain/categories/${categoryId}/analyze-note`,
      { note },
    );
    return response.data;
  },

  async createDesign(categoryId: string, request: string): Promise<{
    designOutput: BrainDesignOutput;
    state: WorkflowBrainState;
  }> {
    const response = await api.post(`/workflow-brain/categories/${categoryId}/design`, {
      request,
    });
    return response.data;
  },

  async updateCategorySettings(
    categoryId: string,
    settings: Partial<CategorySettings>,
  ): Promise<WorkflowBrainCategory> {
    const response = await api.patch(`/workflow-brain/categories/${categoryId}`, settings);
    return response.data;
  },

  async listDocuments(categoryId: string): Promise<{ documents: BrainDocument[] }> {
    const response = await api.get(`/workflow-brain/categories/${categoryId}/documents`);
    return response.data;
  },

  async uploadDocument(
    categoryId: string,
    file: File,
    meta?: UploadDocumentMeta,
  ): Promise<{ document: BrainDocument }> {
    const form = new FormData();
    form.append("file", file);
    if (meta?.title) form.append("title", meta.title);
    if (meta?.kind) form.append("kind", meta.kind);
    if (meta?.version) form.append("version", meta.version);
    if (meta?.source) form.append("source", meta.source);
    const response = await api.post(`/workflow-brain/categories/${categoryId}/documents`, form);
    return response.data;
  },

  async setDocumentStatus(
    documentId: string,
    status: Extract<DocStatus, "active" | "archived">,
    acknowledgeFlags?: string[],
  ): Promise<{ document: BrainDocument }> {
    const response = await api.patch(`/workflow-brain/documents/${documentId}`, {
      status,
      ...(acknowledgeFlags ? { acknowledgeFlags } : {}),
    });
    return response.data;
  },

  async listDatasetDefinitions(): Promise<{ definitions: DatasetDefinitionSummary[] }> {
    const response = await api.get("/workflow-brain/dataset-definitions");
    return response.data;
  },

  async dryRunImport(
    categoryId: string,
    datasetKey: string,
    files: Record<string, File>,
  ): Promise<{ importId: string; report: ImportReportView }> {
    const form = new FormData();
    for (const [name, file] of Object.entries(files)) form.append(name, file);
    const response = await api.post(
      `/workflow-brain/categories/${categoryId}/datasets/${encodeURIComponent(datasetKey)}/imports?dryRun=true`,
      form,
    );
    return response.data;
  },

  async commitImport(
    importId: string,
    acknowledgeWarnings: boolean,
  ): Promise<{ committed: unknown; revisions: unknown }> {
    const response = await api.post(`/workflow-brain/imports/${importId}/commit`, {
      acknowledgeWarnings,
    });
    return response.data;
  },

  async rollbackImport(importId: string): Promise<{ rolledBack: unknown; restored: unknown }> {
    const response = await api.post(`/workflow-brain/imports/${importId}/rollback`);
    return response.data;
  },

  async listDatasetRecords(
    categoryId: string,
    datasetKey: string,
    table: string,
    page: number,
    pageSize: number,
  ): Promise<DatasetRecordsPage> {
    const response = await api.get(
      `/workflow-brain/categories/${categoryId}/datasets/${encodeURIComponent(datasetKey)}/tables/${encodeURIComponent(table)}/records`,
      { params: { page, pageSize } },
    );
    return response.data;
  },

  async downloadDatasetTemplate(categoryId: string, datasetKey: string): Promise<Blob> {
    const response = await api.get(
      `/workflow-brain/categories/${categoryId}/datasets/${encodeURIComponent(datasetKey)}/template.zip`,
      { responseType: "blob" },
    );
    return response.data;
  },

  async reindexCategory(categoryId: string): Promise<unknown> {
    const response = await api.post(`/workflow-brain/categories/${categoryId}/reindex`);
    return response.data;
  },
};
