import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  FileText,
  GitBranch,
  Workflow,
  Plus,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  SectionHeader,
  Select,
  Spinner,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@odessa-separator/ui";
import { useAuth } from "../hooks/useAuth";
import StatusBanner, { StatusBannerVariant } from "../components/StatusBanner";
import {
  BrainMemory,
  WorkflowBrainCategory,
  WorkflowBrainDomain,
  WorkflowBrainState,
  workflowBrainService,
} from "../services/workflowBrain.service";

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
  | "memory"
  | "unknowns"
  | "designs";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "workflow", label: "Workflow" },
  { key: "memory", label: "Memory" },
  { key: "unknowns", label: "Unknown Areas" },
  { key: "designs", label: "Design Outputs" },
];

const designExamples = [
  "Create an intake checklist for separator design requests.",
  "Create a QA review workflow for chemical treatment proposals.",
  "What information is missing before engineering can evaluate this request?",
];

type BadgeVariant = "neutral" | "accent" | "success" | "info" | "warning" | "danger";

const severityVariant = (severity: string): BadgeVariant => {
  if (severity === "high") return "danger";
  if (severity === "medium") return "warning";
  return "success";
};

const isTabKey = (value: string): value is TabKey =>
  tabs.some((tab) => tab.key === value);

const WorkflowBrainPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [banner, setBanner] = React.useState<{
    variant: StatusBannerVariant;
    title: string;
    message: string;
  } | null>(null);
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

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error && typeof error === "object") {
      const response = (error as { response?: { data?: { error?: string; message?: string } } })
        .response;
      return response?.data?.error || response?.data?.message || fallback;
    }
    return fallback;
  };

  const createCategory = useMutation({
    mutationFn: workflowBrainService.createCategory,
    onSuccess: async (category) => {
      setNewCategory({ name: "", description: "", domain: "general" });
      setSelectedCategoryId(category._id);
      setBanner({
        variant: "success",
        title: "Category created",
        message: `${category.name} is ready for category-specific memory.`,
      });
      await refreshState();
    },
    onError: (error) =>
      setBanner({
        variant: "error",
        title: "Category was not created",
        message: getErrorMessage(error, "Failed to create Workflow Brain category."),
      }),
  });

  const addMemory = useMutation({
    mutationFn: () => workflowBrainService.addMemory(selectedCategoryId, memoryText),
    onSuccess: async () => {
      setMemoryText("");
      setBanner({
        variant: "success",
        title: "Memory saved",
        message: "This fact is now available as context for Brain answers.",
      });
      await refreshState();
    },
    onError: (error) =>
      setBanner({
        variant: "error",
        title: "Memory was not saved",
        message: getErrorMessage(error, "Failed to save memory."),
      }),
  });

  const analyzeNote = useMutation({
    mutationFn: () => workflowBrainService.analyzeNote(selectedCategoryId, noteText),
    onSuccess: async () => {
      setNoteText("");
      setBanner({
        variant: "success",
        title: "Workflow note analyzed",
        message: "The category memory and workflow view were updated.",
      });
      await refreshState();
    },
    onError: (error) =>
      setBanner({
        variant: "error",
        title: "Workflow note was not analyzed",
        message: getErrorMessage(error, "Failed to analyze workflow note."),
      }),
  });

  const createDesign = useMutation({
    mutationFn: () => workflowBrainService.createDesign(selectedCategoryId, designText),
    onSuccess: async () => {
      setDesignText("");
      setActiveTab("designs");
      setBanner({
        variant: "success",
        title: "Design output generated",
        message: "The new process/design-support output is saved in this category.",
      });
      await refreshState();
    },
    onError: (error) =>
      setBanner({
        variant: "error",
        title: "Design output was not generated",
        message: getErrorMessage(error, "Failed to generate design output."),
      }),
  });

  const updateMemory = useMutation({
    mutationFn: () =>
      workflowBrainService.updateMemory(editingMemory?._id || "", editMemoryText),
    onSuccess: async () => {
      setEditingMemory(null);
      setEditMemoryText("");
      setBanner({
        variant: "success",
        title: "Memory updated",
        message: "The saved memory content was updated.",
      });
      await refreshState();
    },
    onError: (error) =>
      setBanner({
        variant: "error",
        title: "Memory was not updated",
        message: getErrorMessage(error, "Failed to update memory."),
      }),
  });

  const deleteMemory = useMutation({
    mutationFn: (memoryId: string) => workflowBrainService.deleteMemory(memoryId),
    onSuccess: async () => {
      setBanner({
        variant: "success",
        title: "Memory deleted",
        message: "The memory item was removed from this category.",
      });
      await refreshState();
    },
    onError: (error) =>
      setBanner({
        variant: "error",
        title: "Memory was not deleted",
        message: getErrorMessage(error, "Failed to delete memory."),
      }),
  });

  const categories = categoriesQuery.data || [];
  const state = stateQuery.data as WorkflowBrainState | undefined;
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

  const cancelMemoryEdit = () => {
    setEditingMemory(null);
    setEditMemoryText("");
  };

  return (
    <div className="min-h-full bg-bg">
      <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 sm:p-5 lg:p-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-5">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="grid size-10 shrink-0 place-items-center rounded-control bg-accent text-on-accent"
              aria-hidden="true"
            >
              <Workflow size={21} />
            </span>
            <SectionHeader
              as="h1"
              title="OSI Workflow Brain"
              description="Build category-specific operational memory for OSI. Capture process knowledge. Generate better decisions."
              className="min-w-0"
            />
          </div>
          <Card className="flex w-full min-w-0 items-center gap-2 px-3 py-2.5 text-xs font-bold text-text-muted lg:w-auto lg:min-w-52">
            <ShieldCheck size={17} className="shrink-0 text-accent" aria-hidden="true" />
            Category-scoped OSI context
          </Card>
        </header>

        {banner && (
          <StatusBanner
            variant={banner.variant}
            title={banner.title}
            message={banner.message}
            onDismiss={() => setBanner(null)}
          />
        )}

        {!banner && (categoriesQuery.error || stateQuery.error) && (
          <StatusBanner
            variant="error"
            title="Workflow Brain data did not load"
            message={getErrorMessage(
              categoriesQuery.error || stateQuery.error,
              "Failed to load Workflow Brain data. Please try again.",
            )}
          />
        )}

        {categories.length > 0 && (
          <Card className="p-4 lg:hidden">
            <Field label="Category">
              {(control) => (
                <Select
                  {...control}
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                >
                  {categories.map((category: WorkflowBrainCategory) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          </Card>
        )}

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5">
          <aside
            aria-label="Workflow Brain categories"
            className="order-2 flex min-w-0 flex-col gap-4 lg:order-none"
          >
            <Card className="hidden lg:block">
              <CardHeader>
                <CardTitle as="h2" className="text-base">
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-1.5">
                  {categories.map((category: WorkflowBrainCategory) => {
                    const isSelected = category._id === selectedCategoryId;
                    return (
                      <li key={category._id}>
                        <Button
                          variant={isSelected ? "accent" : "outline"}
                          aria-pressed={isSelected}
                          onClick={() => setSelectedCategoryId(category._id)}
                          className="h-auto w-full flex-col items-start gap-1 px-3 py-2.5 text-left whitespace-normal"
                        >
                          <span className="text-sm font-bold">{category.name}</span>
                          <span className="text-xs leading-snug font-normal">
                            {category.description || "Category memory for OSI operations."}
                          </span>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle as="h2" className="text-base">
                  Create Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitCategory} className="flex flex-col gap-3">
                  <Field label="Category name">
                    {(control) => (
                      <Input
                        {...control}
                        value={newCategory.name}
                        onChange={(event) =>
                          setNewCategory((current) => ({ ...current, name: event.target.value }))
                        }
                        disabled={!canEdit}
                        placeholder="Category name"
                      />
                    )}
                  </Field>
                  <Field label="Domain">
                    {(control) => (
                      <Select
                        {...control}
                        value={newCategory.domain}
                        onChange={(event) =>
                          setNewCategory((current) => ({
                            ...current,
                            domain: event.target.value as WorkflowBrainDomain,
                          }))
                        }
                        disabled={!canEdit}
                      >
                        {domains.map((domain) => (
                          <option key={domain.value} value={domain.value}>
                            {domain.label}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Field label="Description">
                    {(control) => (
                      <Textarea
                        {...control}
                        value={newCategory.description}
                        onChange={(event) =>
                          setNewCategory((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="What should this category remember?"
                        rows={3}
                        className="resize-y"
                        disabled={!canEdit}
                      />
                    )}
                  </Field>
                  <div>
                    <Button
                      type="submit"
                      variant="accent"
                      size="sm"
                      disabled={!canEdit || createCategory.isPending || !newCategory.name.trim()}
                    >
                      <Plus size={15} aria-hidden="true" /> Create
                    </Button>
                  </div>
                  {!canEdit && (
                    <p className="text-xs text-text-muted">
                      View-only role can read category memory and outputs.
                    </p>
                  )}
                  {canDeleteCategory && (
                    <p className="text-xs text-text-muted">
                      Admins can deactivate categories through the API.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </aside>

          <section aria-label="Category workspace" className="order-1 min-w-0 lg:order-none">
            {stateQuery.isLoading || categoriesQuery.isLoading ? (
              <Card className="flex items-center gap-3 p-8 text-text-muted">
                <Spinner size="sm" label="Loading workflow brain..." />
                <span aria-hidden="true">Loading workflow brain...</span>
              </Card>
            ) : !selectedCategory || !state ? (
              <EmptyState
                icon={<Workflow size={40} />}
                title="Select or create a category to begin."
                titleAs="h2"
                className="bg-surface"
              />
            ) : (
              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader className="flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <CardTitle as="h2">{selectedCategory.name}</CardTitle>
                      {selectedCategory.description && (
                        <CardDescription>{selectedCategory.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant="accent" className="shrink-0 self-start">
                      {domains.find((domain) => domain.value === selectedCategory.domain)?.label ||
                        selectedCategory.domain}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div
                      role="group"
                      aria-label="Category summary"
                      className="grid grid-cols-[repeat(auto-fit,minmax(132px,1fr))] gap-2.5"
                    >
                      <StatCard label="Memory items" value={state.memories.length} />
                      <StatCard label="Workflow steps" value={state.workflowSteps.length} />
                      <StatCard label="Unknown areas" value={openUnknowns.length} />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card>
                    <form onSubmit={submitMemory}>
                      <CardHeader className="flex-row items-center gap-2">
                        <FileText size={17} className="shrink-0 text-accent" aria-hidden="true" />
                        <CardTitle className="text-base">
                          <label htmlFor="workflow-brain-memory">Add Memory Fact</label>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-start gap-3">
                        <Textarea
                          id="workflow-brain-memory"
                          value={memoryText}
                          onChange={(event) => setMemoryText(event.target.value)}
                          disabled={!canEdit}
                          rows={4}
                          className="resize-y"
                          placeholder="Add category knowledge. This saves memory only and does not run analysis."
                        />
                        <Button
                          type="submit"
                          variant="accent"
                          size="sm"
                          disabled={!canEdit || addMemory.isPending || !memoryText.trim()}
                        >
                          <Plus size={15} aria-hidden="true" /> Save Memory
                        </Button>
                      </CardContent>
                    </form>
                  </Card>

                  <Card>
                    <form onSubmit={submitNote}>
                      <CardHeader className="flex-row items-center gap-2">
                        <GitBranch size={17} className="shrink-0 text-accent" aria-hidden="true" />
                        <CardTitle className="text-base">
                          <label htmlFor="workflow-brain-note">Add Workflow Note</label>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex flex-col items-start gap-3">
                        <Textarea
                          id="workflow-brain-note"
                          value={noteText}
                          onChange={(event) => setNoteText(event.target.value)}
                          disabled={!canEdit}
                          rows={4}
                          className="resize-y"
                          placeholder="Describe a process issue, handoff, approval step, or operational note for this category."
                        />
                        <Button
                          type="submit"
                          variant="accent"
                          size="sm"
                          disabled={!canEdit || analyzeNote.isPending || !noteText.trim()}
                        >
                          <Send size={15} aria-hidden="true" />
                          Analyze Note
                        </Button>
                      </CardContent>
                    </form>
                  </Card>
                </div>

                <Card>
                  <form onSubmit={submitDesign}>
                    <CardHeader className="flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <ClipboardCheck size={18} className="shrink-0 text-accent" aria-hidden="true" />
                        <CardTitle className="text-base">
                          <label htmlFor="workflow-brain-design">
                            Ask for Design or Process Output
                          </label>
                        </CardTitle>
                      </div>
                      <Badge variant="neutral" className="self-start whitespace-normal">
                        Engineering review required for final specs
                      </Badge>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <Textarea
                        id="workflow-brain-design"
                        value={designText}
                        onChange={(event) => setDesignText(event.target.value)}
                        disabled={!canEdit}
                        rows={4}
                        className="resize-y"
                        placeholder="Ask this category brain to create a checklist, workflow, process, or design-support output..."
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div
                          role="group"
                          aria-label="Example requests"
                          className="flex min-w-0 flex-wrap gap-1.5"
                        >
                          {designExamples.map((example) => (
                            <Button
                              key={example}
                              variant="outline"
                              size="sm"
                              disabled={!canEdit}
                              onClick={() => setDesignText(example)}
                              className="h-auto min-h-8 max-w-full py-1 text-left text-xs font-normal whitespace-normal text-text-muted"
                            >
                              {example}
                            </Button>
                          ))}
                        </div>
                        <Button
                          type="submit"
                          variant="accent"
                          size="sm"
                          disabled={!canEdit || createDesign.isPending || !designText.trim()}
                        >
                          <Send size={15} aria-hidden="true" />
                          Generate
                        </Button>
                      </div>
                    </CardContent>
                  </form>
                </Card>

                <Card className="min-w-0">
                  <Tabs
                    value={activeTab}
                    onValueChange={(value) => {
                      if (isTabKey(value)) setActiveTab(value);
                    }}
                  >
                    <TabsList aria-label="Workflow Brain views" className="max-w-full px-2.5 pt-2">
                      {tabs.map((tab) => (
                        <TabsTrigger key={tab.key} value={tab.key}>
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {tabs.map((tab) => (
                      <TabsContent key={tab.key} value={tab.key} className="p-4">
                        {renderTab(tab.key)}
                      </TabsContent>
                    ))}
                  </Tabs>
                </Card>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );

  function renderTab(tab: TabKey) {
    if (!state) return null;

    if (tab === "workflow") {
      return state.workflowSteps.length ? (
        <ol className="grid gap-2.5" aria-label="Workflow steps">
          {state.workflowSteps.map((step, index) => (
            <li key={step._id}>
              <Card className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-text">
                    {index + 1}. {step.name}
                  </h3>
                  <p className="mt-1 text-sm leading-normal text-text-muted">
                    {step.description || "No description captured yet."}
                  </p>
                </div>
                <Badge
                  variant={step.status === "risky" ? "danger" : "accent"}
                  className="shrink-0 self-start capitalize"
                >
                  {step.status}
                </Badge>
              </Card>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          title="No workflow steps have been identified for this category yet."
          titleAs="h3"
        />
      );
    }

    if (tab === "memory") {
      return state.memories.length ? (
        <ul className="grid gap-2.5" aria-label="Memory items">
          {state.memories.map((memory) => (
            <li key={memory._id}>
              <Card className="p-3.5">
                {editingMemory?._id === memory._id ? (
                  <div className="flex flex-col gap-2.5">
                    <Textarea
                      aria-label="Update memory content"
                      value={editMemoryText}
                      onChange={(event) => setEditMemoryText(event.target.value)}
                      placeholder="Update memory content"
                      rows={4}
                      className="resize-y"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="accent"
                        size="sm"
                        disabled={!editMemoryText.trim() || updateMemory.isPending}
                        onClick={() => updateMemory.mutate()}
                      >
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelMemoryEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge
                        variant={memory.source === "memory" ? "accent" : "neutral"}
                        className="capitalize"
                      >
                        {memory.type.replace(/_/g, " ")}
                      </Badge>
                      {canEdit && (
                        <div className="flex gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => startMemoryEdit(memory)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-danger-text"
                            onClick={() => deleteMemory.mutate(memory._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed break-words text-text">
                      {memory.content}
                    </p>
                  </>
                )}
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No memory has been captured for this category yet."
          titleAs="h3"
        />
      );
    }

    if (tab === "unknowns") {
      return state.unknownAreas.length ? (
        <ul className="grid gap-2.5" aria-label="Unknown areas">
          {state.unknownAreas.map((unknown) => (
            <li key={unknown._id}>
              <Card className="flex flex-col gap-2 p-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-text">{unknown.title}</h3>
                  <p className="mt-1 text-sm leading-normal text-text-muted">
                    {unknown.description}
                  </p>
                  <p className="mt-2 rounded-control bg-warning-bg p-2.5 text-sm font-semibold text-warning-text">
                    {unknown.suggestedQuestion}
                  </p>
                </div>
                <Badge
                  variant={severityVariant(unknown.severity)}
                  className="shrink-0 self-start capitalize"
                >
                  {unknown.severity}
                </Badge>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No unknown areas have been identified for this category yet."
          titleAs="h3"
        />
      );
    }

    return state.designOutputs.length ? (
      <ul className="grid gap-3" aria-label="Design outputs">
        {state.designOutputs.map((design) => (
          <li key={design._id}>
            <Card className="p-4">
              <h3 className="text-base font-bold text-text">{design.title}</h3>
              <p className="mt-1 mb-2.5 text-sm text-text-muted">Request: {design.request}</p>
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-text">
                {design.answer}
              </p>
              <OutputList title="Required Inputs" items={design.requiredInputs} />
              <OutputList title="Risks" items={design.risks} />
              <OutputList title="Recommended Next Steps" items={design.recommendedNextSteps} />
            </Card>
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState
        title="No design or process outputs have been generated for this category yet."
        titleAs="h3"
      />
    );
  }
};

const OutputList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <h4 className="mb-1 text-xs font-bold text-text">{title}</h4>
      <ul className="list-disc space-y-0.5 pl-5 text-sm leading-normal text-text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default WorkflowBrainPage;
