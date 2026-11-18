import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Check, Upload } from "lucide-react";
import {
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Field,
  FileInput,
  Input,
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
import type { BrainDocument, DocKind } from "../../types/brainKnowledge.types";
import {
  DOC_KINDS,
  badgeVariantForEmbedding,
  badgeVariantForStatus,
  canActivate,
  fileSizeLimitError,
  tickedFlagKeys,
  uploadFormError,
} from "./brainPanels.logic";

interface KnowledgeDocumentsPanelProps {
  categoryId: string;
}

type Notice = { variant: StatusBannerVariant; title: string; message: string };

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
};

const KnowledgeDocumentsPanel: React.FC<KnowledgeDocumentsPanelProps> = ({ categoryId }) => {
  const queryClient = useQueryClient();
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [title, setTitle] = React.useState("");
  const [kind, setKind] = React.useState<DocKind | "">("");
  const [version, setVersion] = React.useState("");
  const [source, setSource] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<Notice | null>(null);
  // Draft under review (flags) and the flag keys ticked so far.
  const [reviewDoc, setReviewDoc] = React.useState<BrainDocument | null>(null);
  const [ticked, setTicked] = React.useState<Set<string>>(new Set());
  const [archiveTarget, setArchiveTarget] = React.useState<BrainDocument | null>(null);

  // Reset local state when the category changes.
  React.useEffect(() => {
    setFile(null);
    setTitle("");
    setKind("");
    setVersion("");
    setSource("");
    setFormError(null);
    setNotice(null);
    setReviewDoc(null);
    setTicked(new Set());
    setArchiveTarget(null);
    if (fileRef.current) fileRef.current.value = "";
  }, [categoryId]);

  const queryKey = ["brainDocuments", categoryId] as const;
  const documentsQuery = useQuery({
    queryKey,
    queryFn: async () => (await workflowBrainService.listDocuments(categoryId)).documents,
  });
  const documents = documentsQuery.data ?? [];

  const fail = async (title: string, error: unknown) => {
    const info = await extractApiErrorAsync(error);
    setNotice({ variant: "error", title, message: info.message });
  };

  const upload = useMutation({
    mutationFn: () =>
      workflowBrainService
        .uploadDocument(categoryId, file as File, {
          title: title.trim() || undefined,
          kind: kind || undefined,
          version: version.trim() || undefined,
          source: source.trim() || undefined,
        })
        .then((r) => r.document),
    onSuccess: async (document) => {
      setFile(null);
      setTitle("");
      setKind("");
      setVersion("");
      setSource("");
      if (fileRef.current) fileRef.current.value = "";
      setReviewDoc(document);
      setTicked(new Set());
      setNotice({
        variant: "success",
        title: "Draft created",
        message: document.flags.length
          ? "Review the flagged lines below, then activate the document."
          : "The draft is ready to activate.",
      });
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => fail("Document was not uploaded", error),
  });

  const activate = useMutation({
    mutationFn: (p: { doc: BrainDocument; acknowledgeFlags: string[] }) =>
      workflowBrainService.setDocumentStatus(p.doc.id, "active", p.acknowledgeFlags),
    onSuccess: async () => {
      setReviewDoc(null);
      setTicked(new Set());
      setNotice({ variant: "success", title: "Document activated", message: "It is now used for answers." });
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => fail("Document was not activated", error),
  });

  const archive = useMutation({
    mutationFn: (doc: BrainDocument) => workflowBrainService.setDocumentStatus(doc.id, "archived"),
    onSuccess: async (_result, doc) => {
      setArchiveTarget(null);
      if (reviewDoc?.id === doc.id) setReviewDoc(null);
      setNotice({ variant: "success", title: "Document archived", message: "It is no longer used for answers." });
      await queryClient.invalidateQueries({ queryKey });
    },
    onError: async (error) => {
      setArchiveTarget(null);
      await fail("Document was not archived", error);
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (upload.isPending) return;
    const error = uploadFormError(file, title, kind);
    setFormError(error);
    if (error) return;
    upload.mutate();
  };

  const toggleFlag = (key: string, on: boolean) =>
    setTicked((current) => {
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  const isPdf = file?.name.toLowerCase().endsWith(".pdf") ?? false;

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

      <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Upload a document">
        <Field
          label="File"
          hint="Markdown (.md, up to 200 KB) or PDF (.pdf, up to 20 MB)."
          error={formError ?? undefined}
          className="sm:col-span-2"
        >
          {(control) => (
            <FileInput
              {...control}
              ref={fileRef}
              accept=".md,.pdf"
              disabled={upload.isPending}
              onChange={(event) => {
                const picked = event.target.files?.[0] ?? null;
                setFile(picked);
                setFormError(picked ? fileSizeLimitError(picked) : null);
              }}
            />
          )}
        </Field>
        <Field label="Title" hint={isPdf ? "Required for PDF files." : "Optional for Markdown; front matter can provide it."}>
          {(control) => (
            <Input {...control} value={title} onChange={(e) => setTitle(e.target.value)} disabled={upload.isPending} />
          )}
        </Field>
        <Field
          label="Kind"
          hint="Guidance shapes style only and is never cited. Facts, glossary and procedures can be cited."
        >
          {(control) => (
            <Select
              {...control}
              value={kind}
              onChange={(e) => setKind(e.target.value as DocKind | "")}
              disabled={upload.isPending}
            >
              <option value="">{isPdf ? "Select a kind" : "From front matter"}</option>
              {DOC_KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Version (optional)">
          {(control) => (
            <Input {...control} value={version} onChange={(e) => setVersion(e.target.value)} disabled={upload.isPending} />
          )}
        </Field>
        <Field label="Source (optional)">
          {(control) => (
            <Input {...control} value={source} onChange={(e) => setSource(e.target.value)} disabled={upload.isPending} />
          )}
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" variant="accent" size="sm" disabled={!file || upload.isPending}>
            {upload.isPending ? <Spinner size="sm" label="Uploading document" /> : <Upload size={15} aria-hidden="true" />}
            Upload as draft
          </Button>
        </div>
      </form>

      {reviewDoc && (
        <section
          aria-label="Draft review"
          className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-text">{reviewDoc.title}</h4>
            <Badge variant={badgeVariantForStatus(reviewDoc.status)} className="capitalize">
              {reviewDoc.status}
            </Badge>
          </div>
          {reviewDoc.flags.length > 0 ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm text-text-muted">
                These lines were flagged. Confirm each one before activating.
              </legend>
              {reviewDoc.flags.map((flag) => (
                <div key={flag.key} className="flex flex-col gap-1 border-l-2 border-border pl-3">
                  <p className="text-xs text-text-muted">Line {flag.line}</p>
                  <p className="text-sm break-words whitespace-pre-wrap text-text">{flag.excerpt}</p>
                  <Checkbox
                    label={`I reviewed the flagged text at line ${flag.line}`}
                    checked={ticked.has(flag.key)}
                    onChange={(e) => toggleFlag(flag.key, e.target.checked)}
                    disabled={activate.isPending}
                  />
                </div>
              ))}
            </fieldset>
          ) : (
            <p className="text-sm text-text-muted">No flagged lines.</p>
          )}
          <div>
            <Button
              variant="accent"
              size="sm"
              disabled={
                reviewDoc.status !== "draft" || !canActivate(reviewDoc.flags, ticked) || activate.isPending
              }
              onClick={() => activate.mutate({ doc: reviewDoc, acknowledgeFlags: tickedFlagKeys(reviewDoc.flags, ticked) })}
            >
              {activate.isPending ? <Spinner size="sm" label="Activating" /> : <Check size={15} aria-hidden="true" />}
              Activate
            </Button>
          </div>
        </section>
      )}

      {documentsQuery.isLoading ? (
        <div className="flex items-center gap-2 text-text-muted">
          <Spinner size="sm" label="Loading documents" />
          <span aria-hidden="true">Loading documents...</span>
        </div>
      ) : documentsQuery.error ? (
        <StatusBanner
          variant="error"
          title="Documents did not load"
          message="Failed to load documents. Please try again."
        />
      ) : documents.length === 0 ? (
        <EmptyState title="No documents yet." titleAs="h4" />
      ) : (
        <Table>
          <TableCaption className="sr-only">Knowledge documents</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Format</TableHead>
              <TableHead>Chunks</TableHead>
              <TableHead>Embedding</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>{doc.title}</TableCell>
                <TableCell className="capitalize">{doc.kind}</TableCell>
                <TableCell>{doc.version ?? ""}</TableCell>
                <TableCell>
                  <Badge variant={badgeVariantForStatus(doc.status)} className="capitalize">
                    {doc.status}
                  </Badge>
                </TableCell>
                <TableCell className="uppercase">{doc.sourceFormat}</TableCell>
                <TableCell>{doc.chunkCount}</TableCell>
                <TableCell>
                  <Badge variant={badgeVariantForEmbedding(doc.embeddingStatus)} className="capitalize">
                    {doc.embeddingStatus}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(doc.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.status === "draft" && (
                      <Button variant="outline" size="sm" onClick={() => { setReviewDoc(doc); setTicked(new Set()); }}>
                        Review
                      </Button>
                    )}
                    {doc.status !== "archived" && (
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Archive ${doc.title}`}
                        onClick={() => setArchiveTarget(doc)}
                      >
                        <Archive size={14} aria-hidden="true" /> Archive
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmationModal
        isOpen={archiveTarget !== null}
        title="Archive this document?"
        message="Archived documents are no longer used for answers. This cannot be undone from here."
        confirmLabel="Archive"
        tone="warning"
        isPending={archive.isPending}
        onConfirm={() => archiveTarget && archive.mutate(archiveTarget)}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
};

export default KnowledgeDocumentsPanel;
