import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Field,
  Select,
  type DataTableColumn,
} from "@odessa-separator/ui";
import { Download, ScrollText } from "lucide-react";
import api from "../../services/api";
import { exportRowsToCsv } from "../../utils/csvExport";

interface AuditLog {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  action: string;
  target: string;
  ipAddress?: string;
  createdAt: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const columns: DataTableColumn<AuditLog>[] = [
  {
    key: "timestamp",
    header: "Timestamp",
    cell: (log) => (
      <span className="whitespace-nowrap text-text-muted">
        {formatDate(log.createdAt)}
      </span>
    ),
  },
  {
    key: "user",
    header: "User",
    cell: (log) =>
      log.userId ? (
        <span className="flex flex-col whitespace-nowrap">
          <span className="font-semibold text-text">
            {log.userId.firstName} {log.userId.lastName}
          </span>
          <span className="text-text-muted">{log.userId.email}</span>
        </span>
      ) : (
        <span className="text-text-muted">System</span>
      ),
  },
  {
    key: "action",
    header: "Action",
    cell: (log) => <Badge variant="neutral">{log.action}</Badge>,
  },
  {
    key: "target",
    header: "Target",
    className: "max-w-md truncate",
    cell: (log) => <span className="text-text-muted">{log.target}</span>,
  },
  {
    key: "ipAddress",
    header: "IP Address",
    cell: (log) => (
      <span className="whitespace-nowrap text-text-muted">
        {log.ipAddress || "—"}
      </span>
    ),
  },
];

const AuditLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "audit", page, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });
      if (actionFilter) {
        params.append("action", actionFilter);
      }
      const response = await api.get(`/admin/audit?${params}`);
      return response.data;
    },
  });

  const handleExport = () => {
    const logs: AuditLog[] = data?.logs || [];
    exportRowsToCsv(
      "audit-logs.csv",
      ["Timestamp", "User", "Email", "Action", "Target", "IP Address"],
      logs.map((log) => [
        formatDate(log.createdAt),
        log.userId
          ? `${log.userId.firstName} ${log.userId.lastName}`
          : "System",
        log.userId?.email || "",
        log.action,
        log.target,
        log.ipAddress || "—",
      ]),
    );
  };

  return (
    <section
      aria-labelledby="audit-logs-heading"
      className="flex flex-col gap-4 py-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2
          id="audit-logs-heading"
          className="flex items-center gap-2 text-xl font-semibold text-text"
        >
          <ScrollText className="size-6 text-text-muted" aria-hidden="true" />
          Audit Logs
        </h2>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" aria-hidden="true" />
          Export
        </Button>
      </div>

      <Field label="Filter by Action" className="max-w-xs">
        {(control) => (
          <Select
            {...control}
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Actions</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="USER_LOGOUT">User Logout</option>
            <option value="USER_SSO_LOGIN">SSO Login</option>
            <option value="APP_LAUNCH">App Launch</option>
            <option value="USER_CREATE">User Create</option>
            <option value="USER_UPDATE">User Update</option>
            <option value="USER_DELETE">User Delete</option>
            <option value="APP_CREATE">App Create</option>
            <option value="APP_UPDATE">App Update</option>
            <option value="APP_DELETE">App Delete</option>
          </Select>
        )}
      </Field>

      {error ? (
        <Alert variant="danger">Failed to load audit logs</Alert>
      ) : (
        <>
          <DataTable
            caption="Audit logs"
            columns={columns}
            rows={(data?.logs as AuditLog[] | undefined) ?? []}
            getRowKey={(log) => log._id}
            page={page}
            pageCount={data?.pagination?.pages ?? 1}
            onPageChange={setPage}
            loading={isLoading}
            loadingLabel="Loading audit logs"
            empty={{ title: "No audit logs found" }}
          />
          {data?.pagination && (
            <p className="text-sm text-text-muted">
              Showing page {data.pagination.page} of {data.pagination.pages} (
              {data.pagination.total} total records)
            </p>
          )}
        </>
      )}
    </section>
  );
};

export default AuditLogs;
