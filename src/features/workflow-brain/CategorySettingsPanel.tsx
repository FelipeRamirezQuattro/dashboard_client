import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Save } from "lucide-react";
import { Button, Field, Input, Select, Spinner } from "@odessa-separator/ui";
import StatusBanner, { StatusBannerVariant } from "../../components/StatusBanner";
import {
  WorkflowBrainCategory,
  effectiveAccessRole,
  effectiveGroundingMode,
  effectiveMinEvidenceCount,
  extractApiErrorAsync,
  workflowBrainService,
} from "../../services/workflowBrain.service";
import type { BrainAccessRole, BrainGroundingMode } from "../../types/brainKnowledge.types";
import {
  changedSettings,
  isLoweringAccess,
  isSwitchingToStrict,
  parseMinEvidence,
} from "./brainPanels.logic";

interface CategorySettingsPanelProps {
  categoryId: string;
  category: WorkflowBrainCategory;
}

type Notice = { variant: StatusBannerVariant; title: string; message: string };

const CategorySettingsPanel: React.FC<CategorySettingsPanelProps> = ({ categoryId, category }) => {
  const queryClient = useQueryClient();
  const saved = React.useMemo(
    () => ({
      accessRole: effectiveAccessRole(category),
      groundingMode: effectiveGroundingMode(category),
      minEvidenceCount: effectiveMinEvidenceCount(category),
    }),
    [category],
  );

  const [accessRole, setAccessRole] = React.useState<BrainAccessRole>(saved.accessRole);
  const [groundingMode, setGroundingMode] = React.useState<BrainGroundingMode>(saved.groundingMode);
  const [minEvidence, setMinEvidence] = React.useState(String(saved.minEvidenceCount));
  const [notice, setNotice] = React.useState<Notice | null>(null);

  // Re-sync the form when the selected category or its saved values change.
  React.useEffect(() => {
    setAccessRole(saved.accessRole);
    setGroundingMode(saved.groundingMode);
    setMinEvidence(String(saved.minEvidenceCount));
    setNotice(null);
  }, [categoryId, saved.accessRole, saved.groundingMode, saved.minEvidenceCount]);

  const parsedMin = parseMinEvidence(minEvidence);
  const minError = parsedMin === null ? "Enter a whole number from 1 to 10." : undefined;
  const diff = changedSettings(saved, {
    accessRole,
    groundingMode,
    minEvidenceCount: parsedMin ?? saved.minEvidenceCount,
  });
  const hasChanges = Object.keys(diff).length > 0;

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["workflowBrainCategories"] }),
      queryClient.invalidateQueries({ queryKey: ["workflowBrainState", categoryId] }),
    ]);
  };

  const save = useMutation({
    mutationFn: () => workflowBrainService.updateCategorySettings(categoryId, diff),
    onSuccess: async () => {
      setNotice({ variant: "success", title: "Settings saved", message: "The category settings were updated." });
      await invalidate();
    },
    onError: async (error) => {
      const info = await extractApiErrorAsync(error);
      setNotice({ variant: "error", title: "Settings were not saved", message: info.message });
    },
  });

  const reindex = useMutation({
    mutationFn: () => workflowBrainService.reindexCategory(categoryId),
    onSuccess: (result) =>
      setNotice({
        variant: "success",
        title: "Search index rebuild started",
        message: `Re-indexing ${result.documents} document(s) and ${result.batches} dataset(s).`,
      }),
    onError: async (error) => {
      const info = await extractApiErrorAsync(error);
      setNotice({ variant: "error", title: "Search index was not rebuilt", message: info.message });
    },
  });

  const busy = save.isPending || reindex.isPending;

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <StatusBanner
          variant={notice.variant}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <form
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!hasChanges || parsedMin === null || busy) return;
          save.mutate();
        }}
      >
        <Field label="Minimum role to read" hint="Roles below this cannot read the category.">
          {(control) => (
            <Select
              {...control}
              value={accessRole}
              onChange={(event) => setAccessRole(event.target.value as BrainAccessRole)}
              disabled={busy}
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </Select>
          )}
        </Field>
        <Field label="Grounding mode" hint="Strict answers only from stored records and cites them.">
          {(control) => (
            <Select
              {...control}
              value={groundingMode}
              onChange={(event) => setGroundingMode(event.target.value as BrainGroundingMode)}
              disabled={busy}
            >
              <option value="standard">Standard</option>
              <option value="strict">Strict</option>
            </Select>
          )}
        </Field>
        <Field label="Minimum evidence count" hint="1 to 10" error={minError}>
          {(control) => (
            <Input
              {...control}
              type="number"
              inputMode="numeric"
              min={1}
              max={10}
              step={1}
              value={minEvidence}
              onChange={(event) => setMinEvidence(event.target.value)}
              disabled={busy}
            />
          )}
        </Field>

        <div className="flex flex-col gap-2 sm:col-span-3">
          {isSwitchingToStrict(saved.groundingMode, groundingMode) && (
            <StatusBanner
              variant="warning"
              message="Answers will only use stored records and will cite them; existing answers may change."
            />
          )}
          {isLoweringAccess(saved.accessRole, accessRole) && (
            <StatusBanner variant="warning" message="More roles will be able to read this category." />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
          <Button type="submit" variant="accent" size="sm" disabled={!hasChanges || parsedMin === null || busy}>
            {save.isPending ? (
              <Spinner size="sm" label="Saving settings" />
            ) : (
              <Save size={15} aria-hidden="true" />
            )}
            Save settings
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => reindex.mutate()}>
            {reindex.isPending ? (
              <Spinner size="sm" label="Rebuilding search index" />
            ) : (
              <RefreshCw size={15} aria-hidden="true" />
            )}
            Rebuild search index
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CategorySettingsPanel;
