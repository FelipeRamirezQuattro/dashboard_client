import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, Download, FileText, Tag, RefreshCw, X } from "lucide-react";
import api from "../../services/api";
import { TableRowSkeleton } from "../../components/SkeletonLoader";
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
    onError: (err: any) => {
      setUploadError(
        err?.response?.data?.error || "Upload failed. Please try again.",
      );
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

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Bank</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage uploaded documents and indexed OneDrive files.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsUploadPanelOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-black transition-all active:scale-95"
          style={{
            background: "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
            boxShadow: "0 0 16px rgba(251,173,55,0.25)",
          }}
        >
          <Upload size={16} />
          Upload File
        </button>
      </div>

      {isUploadPanelOpen && (
        <div className="fixed inset-0 z-[140]">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/30"
            aria-label="Close upload panel"
            onClick={() => setIsUploadPanelOpen(false)}
          />
          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
            aria-label="Upload new file"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Upload New File
              </h2>
              <button
                type="button"
                onClick={() => setIsUploadPanelOpen(false)}
                className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close upload panel"
              >
                <X size={18} />
              </button>
            </div>

            <form
              id="file-bank-upload-form"
              onSubmit={handleUpload}
              className="flex-1 space-y-4 overflow-y-auto p-5"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File
                </label>
                <div
                  className="flex items-center gap-3 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors"
                  style={{ borderColor: selectedFile ? "#fbad37" : "#d1d5db" }}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <FileText
                    size={20}
                    className={selectedFile ? "text-yellow-500" : "text-gray-400"}
                  />
                  <span
                    className={`text-sm ${selectedFile ? "text-gray-900 font-medium" : "text-gray-400"}`}
                  >
                    {selectedFile ? selectedFile.name : "Click to select a file"}
                  </span>
                  {selectedFile && (
                    <span className="ml-auto text-xs text-gray-400">
                      {formatBytes(selectedFile.size)}
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    setSelectedFile(e.target.files?.[0] || null);
                    setUploadError(null);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description{" "}
                  <span className="text-red-400 text-xs">(required)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this file contains so the chatbot can match it to user questions..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 resize-none"
                  style={{ borderColor: "#d1d5db" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags{" "}
                  <span className="text-xs text-gray-400">(comma-separated)</span>
                </label>
                <div className="relative">
                  <Tag
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="invoice, sales order, pump report"
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none"
                    style={{ borderColor: "#d1d5db" }}
                  />
                </div>
              </div>

              {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
            </form>

            <div className="border-t border-gray-200 p-5">
              <button
                type="submit"
                form="file-bank-upload-form"
                disabled={uploadMutation.isPending}
                className="flex w-full items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-black transition-all disabled:opacity-50"
                style={{
                  background: "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
                  boxShadow: "0 0 16px rgba(251,173,55,0.3)",
                }}
              >
                <Upload size={16} />
                {uploadMutation.isPending ? "Uploading..." : "Upload File"}
              </button>
            </div>
          </aside>
        </div>
      )}

      <div
        className="rounded-lg border p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{ background: "#ffffff", borderColor: "#e5e7eb" }}
      >
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            OneDrive Document Source
          </h2>
          <p className="text-sm text-gray-500">
            {oneDriveStatus?.configured
              ? `${oneDriveStatus.indexedCount} indexed file${oneDriveStatus.indexedCount === 1 ? "" : "s"}`
              : "Not configured. Add OneDrive env settings on the server."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => oneDriveSyncMutation.mutate()}
          disabled={!oneDriveStatus?.configured || oneDriveSyncMutation.isPending}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={oneDriveSyncMutation.isPending ? "animate-spin" : ""}
          />
          {oneDriveSyncMutation.isPending ? "Syncing..." : "Sync OneDrive"}
        </button>
      </div>

      {/* File Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: "#e5e7eb" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr
              style={{
                background: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                File
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tags
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Uploaded
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <>
                <TableRowSkeleton columns={6} />
                <TableRowSkeleton columns={6} />
                <TableRowSkeleton columns={6} />
              </>
            ) : error ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-red-500 text-sm"
                >
                  Failed to load files.
                </td>
              </tr>
            ) : !files || files.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-gray-400 text-sm"
                >
                  No files uploaded yet. Upload a file above to make it
                  available to the chatbot.
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr
                  key={file._id}
                  className="border-t transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#e5e7eb" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900 truncate max-w-[180px]">
                        {file.originalName}
                      </span>
                      {file.source === "onedrive" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700">
                          OneDrive
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[220px]">
                    <span className="line-clamp-2">{file.description}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {file.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: "rgba(251,173,55,0.12)",
                            color: "#b07d00",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatBytes(file.sizeBytes)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (file.source === "onedrive" && file.webUrl) {
                            window.open(file.webUrl, "_blank", "noopener,noreferrer");
                            return;
                          }
                          downloadFileBankDocument(file.downloadUrl, file.originalName);
                        }}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete "${file.originalName}"? This cannot be undone.`,
                            )
                          ) {
                            deleteMutation.mutate(file._id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FileBankManager;
