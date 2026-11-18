import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, RotateCcw, ShieldCheck, Upload } from "lucide-react";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  FileInput,
  Pagination,
  Select,
  Spinner,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@odessa-separator/ui";
import StatusBanner, { StatusBannerVariant } from "../../components/StatusBanner";
import ConfirmationModal from "../../components/ConfirmationModal";
import { extractApiErrorAsync, workflowBrainService } from "../../services/workflowBrain.service";
import type {
  CommitImportResult,
  DatasetDefinitionSummary,
  ImportReportView,
  RollbackImportResult,
} from "../../types/brainKnowledge.types";
import {
  badgeVariantForSeverity,
  canCommit,
  fileExtension,
  groupIssuesByFile,
  hasWarnings,
  recordColumns,
  totalPages,
} from "./brainPanels.logic";

interface DatasetImportPanelProps {
  categoryId: string;
}

type Notice = { variant: StatusBannerVariant; title: string; message: string };

const PAGE_SIZE = 20;

const cellText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // deferred: revoking synchronously can cancel the download in some browsers
  setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const ImportReportPanel: React.FC<{ report: ImportReportView }> = ({ report }) => {
  const byFile = groupIssuesByFile(report.issues);
  const rejected = report.issues.some((i) => i.severity === "reject");
  return (
    <div className="flex flex-col gap-3">
      <StatusBanner
        variant={report.canCommit ? (hasWarnings(report) ? "warning" : "success") : "error"}
        title={report.canCommit ? "Ready to import" : "Fix the rejected rows and upload again"}
        message={
          report.canCommit
            ? hasWarnings(report)
              ? "The files can be imported. Review the warnings below first."
              : "No problems were found."
            : rejected
              ? "Some rows were rejected, so nothing can be imported yet."
              : "The files cannot be imported yet."
        }
      />
      <Table>
        <TableCaption className="sr-only">Rows per file</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>File</TableHead>
            <TableHead>Rows read</TableHead>
            <TableHead>Accepted</TableHead>
            <TableHead>Rejected</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.entries(report.files).map(([file, counts]) => (
            <TableRow key={file}>
              <TableCell>{file}</TableCell>
              <TableCell>{counts.rowsRead}</TableCell>
              <TableCell>{counts.rowsAccepted}</TableCell>
              <TableCell>{counts.rowsRejected}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {report.issues.length > 0 && (
        <>
          <Table>
            <TableCaption className="sr-only">Issues found in the files</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>File</TableHead>
                <TableHead>Row</TableHead>
                <TableHead>Column</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(byFile).flatMap(([file, issues]) =>
                issues.map((issue, index) => (
                  <TableRow key={`${file}-${index}`}>
                    <TableCell>
                      <Badge variant={badgeVariantForSeverity(issue.severity)}>
                        {issue.severity === "reject" ? "Rejected" : "Warning"}
                      </Badge>
                    </TableCell>
                    <TableCell>{issue.file}</TableCell>
                    <TableCell>{issue.row}</TableCell>
                    <TableCell>{issue.column ?? ""}</TableCell>
                    <TableCell>{issue.code}</TableCell>
                    <TableCell className="break-words whitespace-pre-wrap">{issue.message}</TableCell>
                  </TableRow>
                )),
              )}
            </TableBody>
          </Table>
          {report.truncated && (
            <p className="text-sm text-text-muted">
              Showing the first {report.issues.length} of {report.issueTotal ?? report.issues.length} issues.
            </p>
          )}
        </>
      )}
    </div>
  );
};

const DatasetImportPanel: React.FC<DatasetImportPanelProps> = ({ categoryId }) => {
  const queryClient = useQueryClient();
  const [datasetKey, setDatasetKey] = React.useState("");
  const [files, setFiles] = React.useState<Record<string, File>>({});
  const [inputVersion, setInputVersion] = React.useState(0); // remounts file inputs on reset
  const [importId, setImportId] = React.useState<string | null>(null);
  const [report, setReport] = React.useState<ImportReportView | null>(null);
  const [ackWarnings, setAckWarnings] = React.useState(false);
  // The last committed import stays rollback-able while new files are picked or checked; it is cleared only by a
  // category/dataset change (remount / resetImport) or a successful rollback.
  const [lastCommit, setLastCommit] = React.useState<{ importId: string; result: CommitImportResult } | null>(null);
  const [rolledBack, setRolledBack] = React.useState<RollbackImportResult | null>(null);
  const [confirmRollback, setConfirmRollback] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice | null>(null);
  const [recordTable, setRecordTable] = React.useState("");
  const [page, setPage] = React.useState(1);

  const definitionsQuery = useQuery({
    queryKey: ["brainDatasetDefinitions"],
    queryFn: async () => (await workflowBrainService.listDatasetDefinitions()).definitions,
  });
  const definitions = definitionsQuery.data ?? [];
  const definition: DatasetDefinitionSummary | undefined = definitions.find((d) => d.key === datasetKey);

  const resetImport = React.useCallback(() => {
    setFiles({});
    setInputVersion((v) => v + 1);
    setImportId(null);
    setReport(null);
    setAckWarnings(false);
    setLastCommit(null);
    setRolledBack(null);
    setConfirmRollback(false);
    setPage(1);
  }, []);

  // Reset everything when the category changes.
  React.useEffect(() => {
    resetImport();
    setDatasetKey("");
    setRecordTable("");
    setNotice(null);
  }, [categoryId, resetImport]);

  // Default to the only/first dataset once definitions arrive.
  React.useEffect(() => {
    if (!datasetKey && definitions.length > 0) setDatasetKey(definitions[0].key);
  }, [definitions, datasetKey]);

  // Reset when the dataset changes.
  React.useEffect(() => {
    resetImport();
    setRecordTable(definition?.tables[0]?.name ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasetKey, resetImport]);

  const fail = async (title: string, error: unknown) => {
    const info = await extractApiErrorAsync(error);
    setNotice({ variant: "error", title, message: info.message });
  };

  const download = useMutation({
    mutationFn: () => workflowBrainService.downloadDatasetTemplate(categoryId, datasetKey),
    onSuccess: (blob) => downloadBlob(blob, `${datasetKey}-template.zip`),
    onError: (error) => fail("Templates were not downloaded", error),
  });

  const dryRun = useMutation({
    mutationFn: () => workflowBrainService.dryRunImport(categoryId, datasetKey, files),
    onSuccess: (result) => {
      setImportId(result.importId);
      setReport(result.report);
      setAckWarnings(false);
      setRolledBack(null);
      setNotice(null);
    },
    onError: (error) => fail("Files were not checked", error),
  });

  const recordsQuery = useQuery({
    queryKey: ["brainDatasetRecords", categoryId, datasetKey, recordTable, page],
    queryFn: () => workflowBrainService.listDatasetRecords(categoryId, datasetKey, recordTable, page, PAGE_SIZE),
    enabled: Boolean(datasetKey && recordTable),
  });

  const refreshRecords = () =>
    queryClient.invalidateQueries({ queryKey: ["brainDatasetRecords", categoryId, datasetKey] });

  const commit = useMutation({
    mutationFn: (id: string) => workflowBrainService.commitImport(id, ackWarnings),
    onSuccess: async (result, id) => {
      setLastCommit({ importId: id, result });
      setRolledBack(null);
      setNotice({ variant: "success", title: "Import committed", message: "The records are now stored." });
      setReport(null);
      setImportId(null);
      setFiles({});
      setInputVersion((v) => v + 1);
      setPage(1);
      await refreshRecords();
    },
    onError: (error) => fail("Import was not committed", error),
  });

  const rollback = useMutation({
    mutationFn: (id: string) => workflowBrainService.rollbackImport(id),
    onSuccess: async (result) => {
      setConfirmRollback(false);
      setRolledBack(result);
      setLastCommit(null);
      setPage(1);
      setNotice({ variant: "success", title: "Import rolled back", message: "The previous records were restored." });
      await refreshRecords();
    },
    onError: async (error) => {
      setConfirmRollback(false);
      await fail("Import was not rolled back", error);
    },
  });

  const busy = dryRun.isPending || commit.isPending || rollback.isPending;
  const requiredMissing = definition?.tables.some((t) => t.required && !files[t.file]) ?? true;
  const records = recordsQuery.data;
  const columns = recordColumns(definition, recordTable);

  return (
    <div className="flex flex-col gap-5">
      {notice && (
        <StatusBanner
          variant={notice.variant}
          title={notice.title}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      {definitionsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-text-muted">
          <Spinner size="sm" label="Loading datasets" />
          <span aria-hidden="true">Loading datasets...</span>
        </div>
      ) : definitionsQuery.error ? (
        <StatusBanner variant="error" title="Datasets did not load" message="Failed to load dataset definitions." />
      ) : definitions.length === 0 ? (
        <EmptyState title="No datasets are available." titleAs="h4" />
      ) : (
        <>
          <Field label="Dataset" className="max-w-md">
            {(control) => (
              <Select {...control} value={datasetKey} onChange={(e) => setDatasetKey(e.target.value)} disabled={busy}>
                {definitions.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label} (v{d.version})
                  </option>
                ))}
              </Select>
            )}
          </Field>

          {definition && (
            <>
              <div className="flex flex-col gap-4">
                {definition.tables.map((table) => (
                  <section key={table.name} aria-label={`Table ${table.name}`} className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-text">{table.name}</h4>
                      <span className="text-xs text-text-muted">{table.file}</span>
                      <Badge variant={table.required ? "accent" : "neutral"}>
                        {table.required ? "Required" : "Optional"}
                      </Badge>
                    </div>
                    <Table>
                      <TableCaption className="sr-only">Columns of {table.name}</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Column</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead>Allowed values</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {table.columns.map((column) => (
                          <TableRow key={column.name}>
                            <TableCell>{column.name}</TableCell>
                            <TableCell>{column.type}</TableCell>
                            <TableCell>{column.required ? "Yes" : "No"}</TableCell>
                            <TableCell>{column.values?.join(", ") ?? ""}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Field
                      label={`${table.file}${table.required ? " (required)" : " (optional)"}`}
                      hint="CSV file."
                      className="max-w-md"
                    >
                      {(control) => (
                        <FileInput
                          {...control}
                          key={`${inputVersion}-${table.file}`}
                          name={table.file}
                          accept=".csv"
                          disabled={busy}
                          onChange={(event) => {
                            const picked = event.target.files?.[0];
                            setFiles((current) => {
                              const next = { ...current };
                              if (picked && fileExtension(picked.name) === "csv") next[table.file] = picked;
                              else delete next[table.file];
                              return next;
                            });
                            setReport(null);
                            setImportId(null);
                          }}
                        />
                      )}
                    </Field>
                  </section>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" disabled={download.isPending} onClick={() => download.mutate()}>
                  {download.isPending ? <Spinner size="sm" label="Downloading" /> : <Download size={15} aria-hidden="true" />}
                  Download CSV templates
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  disabled={busy || requiredMissing || Object.keys(files).length === 0}
                  onClick={() => dryRun.mutate()}
                >
                  {dryRun.isPending ? <Spinner size="sm" label="Checking files" /> : <Upload size={15} aria-hidden="true" />}
                  Check files (dry run)
                </Button>
              </div>

              {report && importId && (
                <div className="flex flex-col gap-3">
                  <ImportReportPanel report={report} />
                  {hasWarnings(report) && report.canCommit && (
                    <Checkbox
                      label="I reviewed the warnings"
                      checked={ackWarnings}
                      onChange={(e) => setAckWarnings(e.target.checked)}
                      disabled={busy}
                    />
                  )}
                  <div>
                    <Button
                      variant="accent"
                      size="sm"
                      disabled={!canCommit(report, ackWarnings) || busy}
                      onClick={() => importId && commit.mutate(importId)}
                    >
                      {commit.isPending ? <Spinner size="sm" label="Committing" /> : <ShieldCheck size={15} aria-hidden="true" />}
                      Commit import
                    </Button>
                  </div>
                </div>
              )}

              {lastCommit && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-text">
                    Committed {lastCommit.result.committed} record(s); {lastCommit.result.revisions} replaced an earlier revision.
                  </p>
                  <div>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmRollback(true)}>
                      <RotateCcw size={15} aria-hidden="true" /> Roll back this import
                    </Button>
                  </div>
                </div>
              )}
              {rolledBack && (
                <p className="text-sm text-text">
                  Rolled back {rolledBack.rolledBack} record(s); {rolledBack.restored} earlier revision(s) restored.
                </p>
              )}

              <section aria-label="Imported records" className="flex flex-col gap-3">
                <h4 className="text-sm font-bold text-text">Imported records</h4>
                <Field label="Table" className="max-w-xs">
                  {(control) => (
                    <Select
                      {...control}
                      value={recordTable}
                      onChange={(e) => {
                        setRecordTable(e.target.value);
                        setPage(1);
                      }}
                    >
                      {definition.tables.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                {recordsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Spinner size="sm" label="Loading records" />
                    <span aria-hidden="true">Loading records...</span>
                  </div>
                ) : recordsQuery.error ? (
                  <StatusBanner variant="error" message="Failed to load imported records." />
                ) : !records || records.items.length === 0 ? (
                  <EmptyState title="No imported records for this table." titleAs="h5" />
                ) : (
                  <>
                    <Table>
                      <TableCaption className="sr-only">Imported records for {recordTable}</TableCaption>
                      <TableHeader>
                        <TableRow>
                          {columns.map((c) => (
                            <TableHead key={c}>{c}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.items.map((item, index) => (
                          <TableRow key={cellText(item.primaryKeyValue) + ":" + cellText(item.revision) + ":" + index}>
                            {columns.map((c) => (
                              <TableCell key={c}>{cellText(item[c])}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <p className="text-xs text-text-muted">{records.total} record(s) in total.</p>
                    <Pagination
                      page={page}
                      pageCount={totalPages(records.total, records.pageSize ?? PAGE_SIZE)}
                      onPageChange={setPage}
                    />
                  </>
                )}
              </section>
            </>
          )}
        </>
      )}

      <ConfirmationModal
        isOpen={confirmRollback}
        title="Roll back this import?"
        message="The records from this import will be removed and the earlier revisions restored."
        confirmLabel="Roll back"
        tone="danger"
        isPending={rollback.isPending}
        onConfirm={() => lastCommit && rollback.mutate(lastCommit.importId)}
        onCancel={() => setConfirmRollback(false)}
      />
    </div>
  );
};

export default DatasetImportPanel;
