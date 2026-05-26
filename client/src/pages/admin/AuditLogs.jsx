import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  RefreshCw,
  User,
  Tag,
  Clock
} from 'lucide-react';
import api from '../../services/api';

const ACTION_BADGE_COLORS = {
  DELETE: 'bg-red-50 text-red-700 border-red-100',
  DEACTIVATE: 'bg-orange-50 text-orange-700 border-orange-100',
  CREATE: 'bg-green-50 text-green-700 border-green-100',
  INVITE: 'bg-teal-50 text-teal-700 border-teal-100',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-100',
  ACTIVATE: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  LOGIN: 'bg-slate-50 text-slate-600 border-slate-200',
  TOGGLE: 'bg-amber-50 text-amber-700 border-amber-100',
  REFUND: 'bg-purple-50 text-purple-700 border-purple-100',
  EXPORT: 'bg-indigo-50 text-indigo-700 border-indigo-100'
};

function getActionColor(action = '') {
  const upper = action.toUpperCase();
  for (const key of Object.keys(ACTION_BADGE_COLORS)) {
    if (upper.includes(key)) return ACTION_BADGE_COLORS[key];
  }
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function timeAgo(iso) {
  const now = Date.now();
  const diff = now - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });

  const [filters, setFilters] = useState({ action: '', role: '' });
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async (page = 1, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 50 };
      if (filters.action) params.action = filters.action;
      if (filters.role) params.role = filters.role;

      const res = await api.get('/api/admin/audit-logs', { params });
      if (res.data?.success) {
        setLogs(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Audit log fetch error:', err);
      setError('Failed to load audit log entries.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleFilterChange = (field, val) => {
    setFilters(prev => ({ ...prev, [field]: val }));
  };

  const handlePageChange = (newPage) => {
    fetchLogs(newPage);
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6 font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-teal-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-teal-700" /> Audit Log Viewer
          </h1>
          <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">
            System-wide change history — operator actions, role changes, product edits and more.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(pagination.page, true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-xs py-2 px-4 font-bold border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by action (e.g. PRODUCT, ORDER, LOGIN...)"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="pl-8 pr-4 py-2 border border-gray-200 bg-white rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none appearance-none min-w-[150px]"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {!loading && (
        <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-400">
          <span className="bg-slate-100 px-2 py-0.5 rounded font-black text-teal-800">
            {pagination.total.toLocaleString()} entries
          </span>
          <span>Page {pagination.page} of {pagination.pages}</span>
          {(filters.action || filters.role) && (
            <button
              onClick={() => setFilters({ action: '', role: '' })}
              className="text-teal-600 hover:text-teal-800 font-bold"
            >
              × Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-2 text-xs text-red-800 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-sm text-gray-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600 mb-2" />
            Loading audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-sm text-gray-400 italic">
            No audit log entries found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-500 border-collapse">
              <thead>
                <tr className="bg-slate-50 font-bold uppercase tracking-wider text-teal-900 border-b border-gray-200 text-[10px]">
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Operator</th>
                  <th className="px-4 py-3.5">Action</th>
                  <th className="px-4 py-3.5">Target</th>
                  <th className="px-4 py-3.5">IP Address</th>
                  <th className="px-4 py-3.5 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <React.Fragment key={log._id}>
                    <tr
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(log._id)}
                    >
                      {/* Timestamp */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-gray-800 text-[11px]">
                            {formatDateTime(log.createdAt)}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(log.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Operator */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-teal-600" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-700 text-[11px]">
                              {log.performedBy?.name || 'System'}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate max-w-[120px]">
                              {log.performedBy?.email || '—'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="px-4 py-3">
                        {log.targetModel ? (
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3 h-3 text-gray-400" />
                            <span className="font-semibold text-gray-600 text-[11px]">{log.targetModel}</span>
                            {log.targetId && (
                              <span className="text-[10px] text-gray-400 font-mono truncate max-w-[80px]">
                                #{String(log.targetId).slice(-6)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>

                      {/* IP */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-gray-500">
                          {log.ipAddress || '—'}
                        </span>
                      </td>

                      {/* Expand toggle */}
                      <td className="px-4 py-3 text-center">
                        {(log.previousValue !== null || log.newValue !== null) ? (
                          <button
                            className="text-[10px] font-bold text-teal-600 hover:text-teal-800 uppercase tracking-wider"
                          >
                            {expandedId === log._id ? '▲ Hide' : '▼ Diff'}
                          </button>
                        ) : (
                          <span className="text-gray-300 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded diff row */}
                    {expandedId === log._id && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {log.previousValue !== null && (
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-wider text-red-600 mb-1.5">Previous Value</p>
                                <pre className="text-[10px] font-mono bg-red-50 border border-red-100 p-3 rounded-lg text-red-800 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                                  {JSON.stringify(log.previousValue, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.newValue !== null && (
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-wider text-green-600 mb-1.5">New Value</p>
                                <pre className="text-[10px] font-mono bg-green-50 border border-green-100 p-3 rounded-lg text-green-800 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                                  {JSON.stringify(log.newValue, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                          {log.userAgent && (
                            <p className="mt-3 text-[9px] text-gray-400 font-semibold truncate">
                              <span className="uppercase tracking-wide font-black text-gray-500">UA:</span> {log.userAgent}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 font-semibold">
            Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} records
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const p = Math.max(1, Math.min(pagination.pages - 4, pagination.page - 2)) + i;
              return (
                <button
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold border transition-colors ${
                    p === pagination.page
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
