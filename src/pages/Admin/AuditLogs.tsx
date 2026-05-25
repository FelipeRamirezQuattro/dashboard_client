import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { TableRowSkeleton } from "../../components/SkeletonLoader";
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

const AuditLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

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
    <div className="rounded-b-lg bg-gray-50 border border-gray-200">
      {/* Audit Logs Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-amber-500 text-xl sm:text-2xl"
            aria-hidden="true"
          >
            manage_search
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Audit Logs
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <button
            onClick={() => setShowFilters((value) => !value)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 touch-manipulation whitespace-nowrap shrink-0"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              tune
            </span>
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 touch-manipulation whitespace-nowrap shrink-0"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              download
            </span>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Filter by Action
            </label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="input-field touch-manipulation"
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
            </select>
          </div>
        </div>
      </div>
      )}

      {/* Logs Table */}
      {isLoading ? (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/[0.08]">
                {[...Array(10)].map((_, i) => (
                  <TableRowSkeleton key={i} columns={5} />
                ))}
              </tbody>
            </table>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center m-6">
          <p className="text-red-600">Failed to load audit logs</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-white/[0.08]">
                  {data?.logs?.map((log: AuditLog) => (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.userId ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.userId.firstName} {log.userId.lastName}
                            </div>
                            <div className="text-sm text-gray-400">
                              {log.userId.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-50 text-gray-600 border border-gray-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                        {log.target}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>

          {/* Pagination */}
          {data?.pagination && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing page {data.pagination.page} of {data.pagination.pages} (
                {data.pagination.total} total records)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= data.pagination.pages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogs;
