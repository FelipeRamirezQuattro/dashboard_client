import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GitBranch,
  Plus,
  Search,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import {
  BrainMemory,
  WorkflowBrainCategory,
  WorkflowBrainDomain,
  WorkflowBrainState,
  workflowBrainService,
} from "../services/workflowBrain.service";

const ACCENT = "#FBAB35";
const SECONDARY = "#596376";
const BG = "#F9F9F9";
const DARK = "#1A1A2E";
const BORDER = "#E4E7EC";
const SURFACE = "#FFFFFF";
const MUTED = "#667085";

const domains: Array<{ value: WorkflowBrainDomain; label: string }> = [
  { value: "gas_separation", label: "Gas Separation" },
  { value: "chemical_treatment", label: "Chemical Treatment" },
  { value: "sand_filtration", label: "Sand / Filtration Control" },
  { value: "sales_engineering", label: "Sales Engineering" },
  { value: "proposals", label: "Proposals" },
  { value: "field_service", label: "Field Service" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "qa_qc", label: "QA/QC" },
  { value: "customer_support", label: "Customer Support" },
  { value: "general", label: "General" },
];

type TabKey =
  | "workflow"
  | "bottlenecks"
  | "recommendations"
  | "memory"
  | "unknowns"
  | "designs";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "workflow", label: "Workflow" },
  { key: "bottlenecks", label: "Bottlenecks" },
  { key: "recommendations", label: "Recommendations" },
  { key: "memory", label: "Memory" },
  { key: "unknowns", label: "Unknown Areas" },
  { key: "designs", label: "Design Outputs" },
];

const cardStyle: React.CSSProperties = {
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  boxShadow: "0 1px 2px rgba(16,24,40,.04)",
};

const severityColor = (severity: string) => {
  if (severity === "high") return "#D92D20";
  if (severity === "medium") return "#B54708";
  return "#027A48";
};

const Pill: React.FC<{ children: React.ReactNode; tone?: string }> = ({
  children,
  tone = SECONDARY,
}) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      borderRadius: 999,
      padding: "3px 8px",
      fontSize: 11,
      fontWeight: 700,
      color: tone,
      background: `${tone}14`,
      textTransform: "capitalize",
    }}
  >
    {children}
  </span>
);

const ActionButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "secondary";
}> = ({ children, onClick, disabled, type = "button", variant = "primary" }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      minHeight: 38,
      borderRadius: 6,
      border: variant === "primary" ? "none" : `1px solid ${BORDER}`,
      padding: "8px 12px",
      background: variant === "primary" ? ACCENT : SURFACE,
      color: variant === "primary" ? DARK : SECONDARY,
      fontSize: 13,
      fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
    }}
  >
    {children}
  </button>
);

const TextArea: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeight?: number;
  disabled?: boolean;
}> = ({ value, onChange, placeholder, minHeight = 92, disabled }) => (
  <textarea
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    style={{
      width: "100%",
      minHeight,
      resize: "vertical",
      border: `1px solid ${BORDER}`,
      borderRadius: 6,
      padding: 12,
      fontSize: 13,
      lineHeight: 1.5,
      color: DARK,
      outlineColor: ACCENT,
      background: disabled ? "#F2F4F7" : SURFACE,
    }}
  />
);

const Metric: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
}> = ({ icon, label, value }) => (
  <div style={{ ...cardStyle, padding: "14px 12px", minWidth: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 6,
          display: "grid",
          placeItems: "center",
          background: "rgba(251,171,53,.13)",
          color: ACCENT,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 21, fontWeight: 800, color: DARK, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.25 }}>
          {label}
        </div>
      </div>
    </div>
  </div>
);

const WorkflowBrainPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<TabKey>("workflow");
  const [newCategory, setNewCategory] = React.useState({
    name: "",
    description: "",
    domain: "general" as WorkflowBrainDomain,
  });
  const [memoryText, setMemoryText] = React.useState("");
  const [noteText, setNoteText] = React.useState("");
  const [designText, setDesignText] = React.useState("");
  const [editingMemory, setEditingMemory] = React.useState<BrainMemory | null>(null);
  const [editMemoryText, setEditMemoryText] = React.useState("");

  const canEdit = user?.role === "editor" || user?.role === "admin" || user?.role === "superadmin";
  const canDeleteCategory = user?.role === "admin" || user?.role === "superadmin";

  const categoriesQuery = useQuery({
    queryKey: ["workflowBrainCategories"],
    queryFn: workflowBrainService.getCategories,
  });

  React.useEffect(() => {
    if (!selectedCategoryId && categoriesQuery.data?.length) {
      setSelectedCategoryId(categoriesQuery.data[0]._id);
    }
  }, [categoriesQuery.data, selectedCategoryId]);

  const stateQuery = useQuery({
    queryKey: ["workflowBrainState", selectedCategoryId],
    queryFn: () => workflowBrainService.getState(selectedCategoryId),
    enabled: Boolean(selectedCategoryId),
  });

  const refreshState = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["workflowBrainCategories"] }),
      queryClient.invalidateQueries({ queryKey: ["workflowBrainState", selectedCategoryId] }),
    ]);
  };

  const createCategory = useMutation({
    mutationFn: workflowBrainService.createCategory,
    onSuccess: async (category) => {
      setNewCategory({ name: "", description: "", domain: "general" });
      setSelectedCategoryId(category._id);
      await refreshState();
    },
  });

  const addMemory = useMutation({
    mutationFn: () => workflowBrainService.addMemory(selectedCategoryId, memoryText),
    onSuccess: async () => {
      setMemoryText("");
      await refreshState();
    },
  });

  const analyzeNote = useMutation({
    mutationFn: () => workflowBrainService.analyzeNote(selectedCategoryId, noteText),
    onSuccess: async () => {
      setNoteText("");
      await refreshState();
    },
  });

  const createDesign = useMutation({
    mutationFn: () => workflowBrainService.createDesign(selectedCategoryId, designText),
    onSuccess: async () => {
      setDesignText("");
      setActiveTab("designs");
      await refreshState();
    },
  });

  const updateMemory = useMutation({
    mutationFn: () =>
      workflowBrainService.updateMemory(editingMemory?._id || "", editMemoryText),
    onSuccess: async () => {
      setEditingMemory(null);
      setEditMemoryText("");
      await refreshState();
    },
  });

  const deleteMemory = useMutation({
    mutationFn: (memoryId: string) => workflowBrainService.deleteMemory(memoryId),
    onSuccess: refreshState,
  });

  const resolveBottleneck = useMutation({
    mutationFn: (bottleneckId: string) =>
      workflowBrainService.resolveBottleneck(selectedCategoryId, bottleneckId),
    onSuccess: refreshState,
  });

  const categories = categoriesQuery.data || [];
  const state = stateQuery.data as WorkflowBrainState | undefined;
  const openBottlenecks = state?.bottlenecks.filter((item) => item.status === "open") || [];
  const openUnknowns = state?.unknownAreas.filter((item) => item.status === "open") || [];

  const selectedCategory = categories.find(
    (category) => category._id === selectedCategoryId,
  );

  const submitCategory = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newCategory.name.trim() || !canEdit) return;
    createCategory.mutate(newCategory);
  };

  const submitMemory = (event: React.FormEvent) => {
    event.preventDefault();
    if (!memoryText.trim() || !selectedCategoryId || !canEdit) return;
    addMemory.mutate();
  };

  const submitNote = (event: React.FormEvent) => {
    event.preventDefault();
    if (!noteText.trim() || !selectedCategoryId || !canEdit) return;
    analyzeNote.mutate();
  };

  const submitDesign = (event: React.FormEvent) => {
    event.preventDefault();
    if (!designText.trim() || !selectedCategoryId || !canEdit) return;
    createDesign.mutate();
  };

  const startMemoryEdit = (memory: BrainMemory) => {
    setEditingMemory(memory);
    setEditMemoryText(memory.content);
  };

  return (
    <div style={{ minHeight: "100%", background: BG }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 20,
            marginBottom: 20,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 8,
                  background: ACCENT,
                  color: DARK,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Brain size={21} />
              </div>
              <div>
                <h1 style={{ margin: 0, color: DARK, fontSize: 26, fontWeight: 800 }}>
                  OSI Workflow Brain
                </h1>
                <p style={{ margin: "3px 0 0", color: MUTED, fontSize: 14 }}>
                  Build category-specific operational memory for OSI. Capture process knowledge. Generate better decisions.
                </p>
              </div>
            </div>
          </div>
          <div
            style={{
              ...cardStyle,
              padding: "10px 12px",
              minWidth: 210,
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: SECONDARY,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <ShieldCheck size={17} color={ACCENT} />
            Category-scoped OSI context
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px minmax(0, 1fr)",
            gap: 18,
            alignItems: "start",
          }}
        >
          <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ ...cardStyle, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: DARK, marginBottom: 10 }}>
                Categories
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {categories.map((category: WorkflowBrainCategory) => (
                  <button
                    key={category._id}
                    onClick={() => setSelectedCategoryId(category._id)}
                    style={{
                      textAlign: "left",
                      border: `1px solid ${
                        category._id === selectedCategoryId ? ACCENT : BORDER
                      }`,
                      borderRadius: 6,
                      padding: 10,
                      background:
                        category._id === selectedCategoryId ? "rgba(251,171,53,.12)" : SURFACE,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: DARK }}>
                      {category.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: MUTED,
                        marginTop: 3,
                        lineHeight: 1.35,
                      }}
                    >
                      {category.description || "Category memory for OSI operations."}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={submitCategory} style={{ ...cardStyle, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: DARK, marginBottom: 10 }}>
                Create Category
              </div>
              <input
                value={newCategory.name}
                onChange={(event) =>
                  setNewCategory((current) => ({ ...current, name: event.target.value }))
                }
                disabled={!canEdit}
                placeholder="Category name"
                style={{
                  width: "100%",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 6,
                  padding: "9px 10px",
                  fontSize: 13,
                  marginBottom: 8,
                }}
              />
              <select
                value={newCategory.domain}
                onChange={(event) =>
                  setNewCategory((current) => ({
                    ...current,
                    domain: event.target.value as WorkflowBrainDomain,
                  }))
                }
                disabled={!canEdit}
                style={{
                  width: "100%",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 6,
                  padding: "9px 10px",
                  fontSize: 13,
                  marginBottom: 8,
                  background: SURFACE,
                }}
              >
                {domains.map((domain) => (
                  <option key={domain.value} value={domain.value}>
                    {domain.label}
                  </option>
                ))}
              </select>
              <TextArea
                value={newCategory.description}
                onChange={(value) =>
                  setNewCategory((current) => ({ ...current, description: value }))
                }
                placeholder="What should this category remember?"
                minHeight={76}
                disabled={!canEdit}
              />
              <div style={{ marginTop: 10 }}>
                <ActionButton
                  type="submit"
                  disabled={!canEdit || createCategory.isPending || !newCategory.name.trim()}
                >
                  <Plus size={15} /> Create
                </ActionButton>
              </div>
              {!canEdit && (
                <p style={{ color: MUTED, fontSize: 12, margin: "10px 0 0" }}>
                  View-only role can read category memory and outputs.
                </p>
              )}
              {canDeleteCategory && (
                <p style={{ color: MUTED, fontSize: 11.5, margin: "10px 0 0" }}>
                  Admins can deactivate categories through the API.
                </p>
              )}
            </form>
          </aside>

          <main style={{ minWidth: 0 }}>
            {stateQuery.isLoading || categoriesQuery.isLoading ? (
              <div style={{ ...cardStyle, padding: 32, color: MUTED }}>Loading workflow brain...</div>
            ) : !selectedCategory || !state ? (
              <div style={{ ...cardStyle, padding: 32, color: MUTED }}>
                Select or create a category to begin.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <section style={{ ...cardStyle, padding: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 14,
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: DARK }}>
                        {selectedCategory.name}
                      </h2>
                      <p style={{ margin: "5px 0 0", color: MUTED, fontSize: 13 }}>
                        {selectedCategory.description}
                      </p>
                    </div>
                    <Pill tone={ACCENT}>
                      {domains.find((domain) => domain.value === selectedCategory.domain)?.label ||
                        selectedCategory.domain}
                    </Pill>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))",
                      gap: 10,
                    }}
                  >
                    <Metric icon={<FileText size={18} />} label="Memory items" value={state.memories.length} />
                    <Metric icon={<GitBranch size={18} />} label="Workflow steps" value={state.workflowSteps.length} />
                    <Metric icon={<AlertTriangle size={18} />} label="Open bottlenecks" value={openBottlenecks.length} />
                    <Metric icon={<Search size={18} />} label="Unknown areas" value={openUnknowns.length} />
                  </div>
                </section>

                <section
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                    gap: 14,
                  }}
                >
                  <form onSubmit={submitMemory} style={{ ...cardStyle, padding: 16 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                      <FileText size={17} color={ACCENT} />
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: DARK }}>
                        Add Memory Fact
                      </h3>
                    </div>
                    <TextArea
                      value={memoryText}
                      onChange={setMemoryText}
                      disabled={!canEdit}
                      placeholder="Add category knowledge. This saves memory only and does not run analysis."
                    />
                    <div style={{ marginTop: 10 }}>
                      <ActionButton
                        type="submit"
                        disabled={!canEdit || addMemory.isPending || !memoryText.trim()}
                      >
                        <Plus size={15} /> Save Memory
                      </ActionButton>
                    </div>
                  </form>

                  <form onSubmit={submitNote} style={{ ...cardStyle, padding: 16 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                      <GitBranch size={17} color={ACCENT} />
                      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: DARK }}>
                        Add Workflow Note
                      </h3>
                    </div>
                    <TextArea
                      value={noteText}
                      onChange={setNoteText}
                      disabled={!canEdit}
                      placeholder="Describe a process issue, handoff, approval step, or operational note for this category."
                    />
                    <div style={{ marginTop: 10 }}>
                      <ActionButton
                        type="submit"
                        disabled={!canEdit || analyzeNote.isPending || !noteText.trim()}
                      >
                        <Send size={15} /> Analyze Note
                      </ActionButton>
                    </div>
                  </form>
                </section>

                <form onSubmit={submitDesign} style={{ ...cardStyle, padding: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <ClipboardCheck size={18} color={ACCENT} />
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: DARK }}>
                        Ask for Design or Process Output
                      </h3>
                    </div>
                    <Pill>Engineering review required for final specs</Pill>
                  </div>
                  <TextArea
                    value={designText}
                    onChange={setDesignText}
                    disabled={!canEdit}
                    minHeight={104}
                    placeholder="Ask this category brain to create a checklist, workflow, process, or design-support output..."
                  />
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 10,
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[
                        "Create an intake checklist for separator design requests.",
                        "Create a QA review workflow for chemical treatment proposals.",
                        "What information is missing before engineering can evaluate this request?",
                      ].map((example) => (
                        <button
                          key={example}
                          type="button"
                          disabled={!canEdit}
                          onClick={() => setDesignText(example)}
                          style={{
                            border: `1px solid ${BORDER}`,
                            background: "#F8FAFC",
                            color: SECONDARY,
                            fontSize: 11.5,
                            borderRadius: 999,
                            padding: "5px 9px",
                            cursor: canEdit ? "pointer" : "not-allowed",
                          }}
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                    <ActionButton
                      type="submit"
                      disabled={!canEdit || createDesign.isPending || !designText.trim()}
                    >
                      <Send size={15} /> Generate
                    </ActionButton>
                  </div>
                </form>

                <section style={cardStyle}>
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      overflowX: "auto",
                      borderBottom: `1px solid ${BORDER}`,
                      padding: "8px 10px 0",
                    }}
                  >
                    {tabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                          border: "none",
                          borderBottom:
                            activeTab === tab.key ? `2px solid ${ACCENT}` : "2px solid transparent",
                          background: "transparent",
                          color: activeTab === tab.key ? DARK : MUTED,
                          fontWeight: 800,
                          fontSize: 12.5,
                          padding: "10px 11px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ padding: 16 }}>{renderTab()}</div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );

  function renderTab() {
    if (!state) return null;

    if (activeTab === "workflow") {
      return state.workflowSteps.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {state.workflowSteps.map((step, index) => (
            <div key={step._id} style={{ ...cardStyle, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ color: DARK, fontSize: 14, fontWeight: 800 }}>
                    {index + 1}. {step.name}
                  </div>
                  <p style={{ color: MUTED, fontSize: 13, margin: "5px 0 0", lineHeight: 1.5 }}>
                    {step.description || "No description captured yet."}
                  </p>
                </div>
                <Pill tone={step.status === "risky" ? "#D92D20" : ACCENT}>{step.status}</Pill>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="No workflow steps have been identified for this category yet." />
      );
    }

    if (activeTab === "bottlenecks") {
      return state.bottlenecks.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {state.bottlenecks.map((bottleneck) => (
            <div key={bottleneck._id} style={{ ...cardStyle, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ color: DARK, fontSize: 14, fontWeight: 800 }}>
                    {bottleneck.title}
                  </div>
                  <p style={{ color: MUTED, fontSize: 13, margin: "5px 0", lineHeight: 1.5 }}>
                    {bottleneck.description}
                  </p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Pill tone={severityColor(bottleneck.severity)}>{bottleneck.severity}</Pill>
                    <Pill>{bottleneck.category.replace(/_/g, " ")}</Pill>
                    <Pill>{bottleneck.status}</Pill>
                  </div>
                </div>
                {canEdit && bottleneck.status !== "resolved" && (
                  <ActionButton
                    variant="secondary"
                    disabled={resolveBottleneck.isPending}
                    onClick={() => resolveBottleneck.mutate(bottleneck._id)}
                  >
                    <CheckCircle2 size={15} /> Resolve
                  </ActionButton>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="No bottlenecks have been identified for this category yet." />
      );
    }

    if (activeTab === "recommendations") {
      return state.recommendations.length ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
          {state.recommendations.map((recommendation) => (
            <div key={recommendation._id} style={{ ...cardStyle, padding: 14 }}>
              <div style={{ color: DARK, fontSize: 14, fontWeight: 800 }}>
                {recommendation.title}
              </div>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.5 }}>
                {recommendation.description}
              </p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                <Pill tone={ACCENT}>{recommendation.recommendationType}</Pill>
                <Pill tone={severityColor(recommendation.estimatedImpact)}>
                  {recommendation.estimatedImpact} impact
                </Pill>
                <Pill>{recommendation.difficulty}</Pill>
              </div>
              {recommendation.requiredInputs.length > 0 && (
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: MUTED, fontSize: 12.5 }}>
                  {recommendation.requiredInputs.slice(0, 5).map((input) => (
                    <li key={input}>{input}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="No recommendations have been generated for this category yet." />
      );
    }

    if (activeTab === "memory") {
      return state.memories.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {state.memories.map((memory) => (
            <div key={memory._id} style={{ ...cardStyle, padding: 14 }}>
              {editingMemory?._id === memory._id ? (
                <>
                  <TextArea
                    value={editMemoryText}
                    onChange={setEditMemoryText}
                    placeholder="Update memory content"
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <ActionButton
                      disabled={!editMemoryText.trim() || updateMemory.isPending}
                      onClick={() => updateMemory.mutate()}
                    >
                      Save
                    </ActionButton>
                    <ActionButton
                      variant="secondary"
                      onClick={() => {
                        setEditingMemory(null);
                        setEditMemoryText("");
                      }}
                    >
                      Cancel
                    </ActionButton>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <Pill tone={memory.source === "memory" ? ACCENT : SECONDARY}>
                      {memory.type.replace(/_/g, " ")}
                    </Pill>
                    {canEdit && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => startMemoryEdit(memory)}
                          style={plainLinkButton}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteMemory.mutate(memory._id)}
                          style={{ ...plainLinkButton, color: "#D92D20" }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <p style={{ margin: "10px 0 0", color: DARK, fontSize: 13, lineHeight: 1.55 }}>
                    {memory.content}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="No memory has been captured for this category yet." />
      );
    }

    if (activeTab === "unknowns") {
      return state.unknownAreas.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {state.unknownAreas.map((unknown) => (
            <div key={unknown._id} style={{ ...cardStyle, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ color: DARK, fontSize: 14, fontWeight: 800 }}>
                    {unknown.title}
                  </div>
                  <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.5 }}>
                    {unknown.description}
                  </p>
                  <div
                    style={{
                      marginTop: 8,
                      padding: 10,
                      borderRadius: 6,
                      background: "#FFFAEB",
                      color: "#7A4B00",
                      fontSize: 12.5,
                      fontWeight: 700,
                    }}
                  >
                    {unknown.suggestedQuestion}
                  </div>
                </div>
                <Pill tone={severityColor(unknown.severity)}>{unknown.severity}</Pill>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="No unknown areas have been identified for this category yet." />
      );
    }

    return state.designOutputs.length ? (
      <div style={{ display: "grid", gap: 12 }}>
        {state.designOutputs.map((design) => (
          <div key={design._id} style={{ ...cardStyle, padding: 16 }}>
            <div style={{ color: DARK, fontSize: 15, fontWeight: 800 }}>{design.title}</div>
            <p style={{ color: MUTED, fontSize: 12.5, margin: "5px 0 10px" }}>
              Request: {design.request}
            </p>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontFamily: "inherit",
                color: DARK,
                fontSize: 13,
                lineHeight: 1.55,
                margin: 0,
              }}
            >
              {design.answer}
            </pre>
            <OutputList title="Required Inputs" items={design.requiredInputs} />
            <OutputList title="Risks" items={design.risks} />
            <OutputList title="Recommended Next Steps" items={design.recommendedNextSteps} />
          </div>
        ))}
      </div>
    ) : (
      <EmptyState text="No design or process outputs have been generated for this category yet." />
    );
  }
};

const plainLinkButton: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: SECONDARY,
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
  padding: 0,
};

const OutputList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: SECONDARY, marginBottom: 5 }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, color: MUTED, fontSize: 12.5, lineHeight: 1.5 }}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      minHeight: 120,
      display: "grid",
      placeItems: "center",
      border: `1px dashed ${BORDER}`,
      borderRadius: 8,
      color: MUTED,
      fontSize: 13,
      textAlign: "center",
      padding: 20,
    }}
  >
    {text}
  </div>
);

export default WorkflowBrainPage;
