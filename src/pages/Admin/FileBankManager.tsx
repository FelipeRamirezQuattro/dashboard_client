import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableToolbar,
  Field,
  FileInput,
  FormDialog,
  Input,
  Textarea,
  useDataTable,
  type DataTableColumn,
} from "@odessa-separator/ui";
import { Upload, Trash2, Download, FileText, RefreshCw } from "lucide-react";
import api from "../../services/api";
import ConfirmationModal from "../../components/ConfirmationModal";
import { downloadFileBankDocument } from "../../utils/fileBankDownload";

interface FileBankRecord {
  _id: string;
  originalName: string;
  description: string;
  tags: string[];
  sizeBytes: number;
  uploadedAt: string;
  downloadUrl: string;
  webUrl?: string;
  mimeType: string;
  source?: "local" | "onedrive";
}

interface OneDriveStatus {
  configured: boolean;
  indexedCount: number;
  lastIndexedAt?: string;
  folderWebUrl?: string;
}

const NO_FILES: FileBankRecord[] = [];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FileBankManager: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Kept after the dialog closes so the message never reads "undefined" while it animates out.
  const [deleteTarget, setDeleteTarget] = useState<FileBankRecord | null>(null);

  const {
    data: files,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["fileBank"],
    queryFn: async () => {
      const response = await api.get<{ files: FileBankRecord[] }>("/file-bank");
      return response.data.files;
    },
  });

  const { data: oneDriveStatus } = useQuery({
    queryKey: ["fileBank", "onedrive", "status"],
    queryFn: async () => {
      const response = await api.get<OneDriveStatus>("/file-bank/onedrive/status");
      return response.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("description", description);
      formData.append("tags", tags);
      await api.post("/file-bank/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fileBank"] });
      setSelectedFile(null);
      setDescription("");
      setTags("");
      setUploadError(null);
      setIsUploadPanelOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: unknown) => {
      const apiError = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      setUploadError(apiError || "Upload failed. Please try again.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/file-bank/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fileBank"] });
    },
  });

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget._id, {
      onSuccess: () => setDeleteOpen(false),
    });
  };

  const oneDriveSyncMutation = useMutation({
    mutationFn: async () => {
      await api.post("/file-bank/onedrive/sync");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fileBank"] });
      queryClient.invalidateQueries({
        queryKey: ["fileBank", "onedrive", "status"],
      });
    },
  });

  const openUploadPanel = () => {
    // The native file picker starts empty each time the dialog opens, so the selected file is
    // cleared to match it. Description and tags drafts are kept, as before.
    setSelectedFile(null);
    setUploadError(null);
    setIsUploadPanelOpen(true);
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!selectedFile) {
      setUploadError("Please select a file.");
      return;
    }
    if (!description.trim()) {
      setUploadError("Please enter a description.");
      return;
    }
    uploadMutation.mutate();
  };

  const download = (file: FileBankRecord) => {
    if (file.source === "onedrive" && file.webUrl) {
      window.open(file.webUrl, "_blank", "noopener,noreferrer");
      return;
    }
    downloadFileBankDocument(file.downloadUrl, file.originalName);
  };

  // The initial sort key has no sorter: the API order is kept until a column header is clicked.
  const table = useDataTable<FileBankRecord>(files ?? NO_FILES, {
    searchText: (file) =>
      `${file.originalName} ${file.description} ${file.tags.join(" ")}`,
    sorters: {
      file: (a, b) => a.originalName.localeCompare(b.originalName),
      size: (a, b) => a.sizeBytes - b.sizeBytes,
      uploaded: (a, b) =>
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
    },
    initialSort: { key: "default", direction: "ascending" },
    pageSize: 10,
  });

  const columns: DataTableColumn<FileBankRecord>[] = [
    {
      key: "file",
      header: "File",
      sortable: true,
      cell: (file) => (
        <span className="flex items-center gap-2">
          <FileText className="size-4 shrink-0 text-text-muted" aria-hidden="true" />
          <span className="max-w-44 truncate font-medium text-text">
            {file.originalName}
          </span>
          {file.source === "onedrive" && <Badge variant="info">OneDrive</Badge>}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (file) => (
        <span className="line-clamp-2 max-w-56 text-text-muted">
          {file.description}
        </span>
      ),
    },
    {
      key: "tags",
      header: "Tags",
      cell: (file) => (
        <span className="flex flex-wrap gap-1">
          {file.tags.map((tag) => (
            <Badge key={tag} variant="accent">
              {tag}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      key: "size",
      header: "Size",
      sortable: true,
      cell: (file) => (
        <span className="whitespace-nowrap text-text-muted">
          {formatBytes(file.sizeBytes)}
        </span>
      ),
    },
    {
      key: "uploaded",
      header: "Uploaded",
      sortable: true,
      cell: (file) => (
        <span className="whitespace-nowrap text-text-muted">
          {new Date(file.uploadedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (file) => (
        <span className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Download ${file.originalName}`}
            title="Download"
            onClick={() => download(file)}
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${file.originalName}`}
            title="Delete"
            disabled={deleteMutation.isPending}
            onClick={() => {
              setDeleteTarget(file);
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </span>
      ),
    },
  ];

  const hasFiles = (files?.length ?? 0) > 0;

  return (
    <section
      aria-labelledby="file-bank-heading"
      className="flex min-w-0 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div>
        <h1 id="file-bank-heading" className="text-2xl font-bold text-text">
          File Bank
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage uploaded documents and indexed OneDrive files.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>OneDrive Document Source</CardTitle>
            <CardDescription>
              {oneDriveStatus?.configured
                ? `${oneDriveStatus.indexedCount} indexed file${oneDriveStatus.indexedCount === 1 ? "" : "s"}`
                : "Not configured. Add OneDrive env settings on the server."}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => oneDriveSyncMutation.mutate()}
            disabled={!oneDriveStatus?.configured || oneDriveSyncMutation.isPending}
          >
            <RefreshCw
              className={oneDriveSyncMutation.isPending ? "size-4 animate-spin" : "size-4"}
              aria-hidden="true"
            />
            {oneDriveSyncMutation.isPending ? "Syncing..." : "Sync OneDrive"}
          </Button>
        </CardHeader>
      </Card>

      <div className="flex flex-col gap-4">
        <DataTableToolbar
          searchLabel="Search files"
          searchPlaceholder="Search files..."
          search={table.search}
          onSearchChange={table.setSearch}
          resultCount={table.total}
          actions={
            <Button onClick={openUploadPanel}>
              <Upload className="size-4" aria-hidden="true" />
              Upload File
            </Button>
          }
        />

        {error ? (
          <Alert variant="danger">Failed to load files.</Alert>
        ) : (
          <DataTable
            caption="File bank documents"
            columns={columns}
            rows={table.rows}
            getRowKey={(file) => file._id}
            sort={table.sort}
            onSortChange={table.toggleSort}
            page={table.page}
            pageCount={table.pageCount}
            onPageChange={table.setPage}
            loading={isLoading}
            loadingLabel="Loading files"
            empty={
              hasFiles
                ? { title: "No files match your search" }
                : {
                    title: "No files uploaded yet",
                    description:
                      "Upload a file above to make it available to the chatbot.",
                  }
            }
          />
        )}
      </div>

      <FormDialog
        open={isUploadPanelOpen}
        onOpenChange={(open) => {
          if (!open) setIsUploadPanelOpen(false);
        }}
        title="Upload New File"
        description="Uploaded files are made available to the chatbot."
        submitLabel={uploadMutation.isPending ? "Uploading..." : "Upload File"}
        busy={uploadMutation.isPending}
        onSubmit={handleUpload}
      >
        <Field
          label="File"
          hint={
            selectedFile
              ? `${selectedFile.name} (${formatBytes(selectedFile.size)})`
              : undefined
          }
        >
          {(control) => (
            <FileInput
              {...control}
              ref={fileInputRef}
              onChange={(e) => {
                setSelectedFile(e.target.files?.[0] || null);
                setUploadError(null);
              }}
            />
          )}
        </Field>

        <Field label="Description (required)">
          {(control) => (
            <Textarea
              {...control}
              rows={4}
              className="resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this file contains so the chatbot can match it to user questions..."
            />
          )}
        </Field>

        <Field label="Tags (comma-separated)">
          {(control) => (
            <Input
              {...control}
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="invoice, sales order, pump report"
            />
          )}
        </Field>

        {uploadError && <Alert variant="danger">{uploadError}</Alert>}
      </FormDialog>

      <ConfirmationModal
        isOpen={deleteOpen}
        title="Delete Document"
        message={`Delete "${deleteTarget?.originalName ?? ""}"? This cannot be undone.`}
        confirmLabel="Delete"
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </section>
  );
};

export default FileBankManager;
