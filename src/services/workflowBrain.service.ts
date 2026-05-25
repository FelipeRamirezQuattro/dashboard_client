import api from "./api";

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
  createdAt: string;
  updatedAt: string;
}

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

};
