import api from "../services/api";

const getApiBasePath = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api-dashboard";
  return new URL(baseUrl, window.location.origin).pathname.replace(/\/$/, "");
};

export const getFileBankApiPath = (url: string): string | null => {
  const parsed = new URL(url, window.location.origin);
  let path = parsed.pathname;
  const apiBasePath = getApiBasePath();

  while (apiBasePath && path.startsWith(`${apiBasePath}${apiBasePath}/`)) {
    path = path.slice(apiBasePath.length);
  }

  if (apiBasePath && path.startsWith(`${apiBasePath}/`)) {
    path = path.slice(apiBasePath.length);
  }

  return path.startsWith("/file-bank/") && path.endsWith("/download")
    ? path
    : null;
};

export const downloadFileBankDocument = async (
  url: string,
  filename?: string,
): Promise<void> => {
  const apiPath = getFileBankApiPath(url);
  if (!apiPath) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const response = await api.get<Blob>(apiPath, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
};
