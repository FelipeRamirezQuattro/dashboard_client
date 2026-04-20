import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, Download, FileText, Tag } from "lucide-react";
import api from "../../services/api";
import { TableRowSkeleton } from "../../components/SkeletonLoader";

interface FileBankRecord {
  _id: string;
  originalName: string;
  description: string;
  tags: string[];
  sizeBytes: number;
  uploadedAt: string;
  downloadUrl: string;
  mimeType: string;
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

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("description", description);
      formData.append("tags", tags);
      await api.post("/file-bank/upload", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fileBank"] });
      setSelectedFile(null);
      setDescription("");
      setTags("");
      setUploadError(null);
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
    <div>
      {/* Upload Form */}
      <div
        className="rounded-b-lg border border-t-0 p-6 mb-6"
        style={{ background: "#ffffff", borderColor: "#e5e7eb" }}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Upload New File
        </h2>

        <form onSubmit={handleUpload} className="space-y-4">
          {/* File input */}
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

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description{" "}
              <span className="text-red-400 text-xs">(required)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this file contains so the chatbot can match it to user questions..."
              rows={2}
              className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 resize-none"
              style={{ borderColor: "#d1d5db" }}
            />
          </div>

          {/* Tags */}
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

          {/* Error */}
          {uploadError && (
            <p className="text-sm text-red-500">{uploadError}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={uploadMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-black transition-all disabled:opacity-50"
            style={{
              background:
                "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
              boxShadow: "0 0 16px rgba(251,173,55,0.3)",
            }}
          >
            <Upload size={16} />
            {uploadMutation.isPending ? "Uploading..." : "Upload File"}
          </button>
        </form>
      </div>

      {/* File Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: "#e5e7eb" }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
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
                <td colSpan={6} className="px-4 py-8 text-center text-red-500 text-sm">
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
                      <a
                        href={`${import.meta.env.VITE_API_BASE_URL || "/api-dashboard"}${file.downloadUrl}`}
                        download={file.originalName}
                        className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
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
  );
};

export default FileBankManager;
