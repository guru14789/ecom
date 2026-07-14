import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import {
  ClipboardList, Search, RefreshCw, ShieldCheck, Store, ShoppingBag,
  User, Cpu, Filter
} from 'lucide-react';

type ActorType = 'all' | 'buyer' | 'vendor' | 'admin' | 'system';

const actorColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  vendor: 'bg-orange-100 text-orange-700',
  buyer: 'bg-blue-100 text-blue-700',
  system: 'bg-gray-100 text-gray-600',
};

const actorIcon = (type: string) => {
  switch (type) {
    case 'admin': return <ShieldCheck className="w-3.5 h-3.5" />;
    case 'vendor': return <Store className="w-3.5 h-3.5" />;
    case 'buyer': return <ShoppingBag className="w-3.5 h-3.5" />;
    default: return <Cpu className="w-3.5 h-3.5" />;
  }
};

const formatAction = (action: string) =>
  action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

const formatTimestamp = (ts: any): string => {
  try {
    const d = ts?.toDate ? ts.toDate() : ts?._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'N/A';
  }
};

export const AdminAuditLogPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState<ActorType>('all');
  const [limit, setLimit] = useState(50);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-audit-log', limit],
    queryFn: async () => {
      const res = await adminApi.auditLog.list({ limit });
      return res.data as any[];
    },
    staleTime: 30_000,
  });

  const logs = data || [];

  const filtered = logs.filter(log => {
    const matchesActor = actorFilter === 'all' || log.actorType === actorFilter;
    const matchesSearch =
      !search ||
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.actorId?.toLowerCase().includes(search.toLowerCase()) ||
      log.resourceType?.toLowerCase().includes(search.toLowerCase()) ||
      log.resourceId?.toLowerCase().includes(search.toLowerCase());
    return matchesActor && matchesSearch;
  });

  const actorCounts = logs.reduce((acc: Record<string, number>, log) => {
    acc[log.actorType] = (acc[log.actorType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">Full trail of all admin, vendor, and buyer actions on the platform.</p>
        </div>
        <button
          onClick={() => refetch()}
          className="relative z-10 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['admin', 'vendor', 'buyer', 'system'] as const).map(type => (
          <button
            key={type}
            onClick={() => setActorFilter(actorFilter === type ? 'all' : type)}
            className={`p-4 rounded-2xl border text-left transition-all hover:shadow-md ${
              actorFilter === type ? 'border-orange-400 ring-2 ring-orange-200' : 'bg-white'
            }`}
          >
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold mb-2 ${actorColors[type]}`}>
              {actorIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
            </div>
            <p className="text-2xl font-black text-blue-950">{actorCounts[type] || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">events</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search action, actor, resource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value as ActorType)}
            className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Actors</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="buyer">Buyer</option>
            <option value="system">System</option>
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value))}
            className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={200}>Last 200</option>
          </select>
        </div>
      </div>

      {/* Audit log table */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-orange-400 animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Loading audit log...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-medium">Failed to load audit log.</p>
            <button onClick={() => refetch()} className="mt-3 text-sm underline text-orange-600">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900">No events found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Timestamp</th>
                  <th className="px-6 py-4 font-bold">Actor</th>
                  <th className="px-6 py-4 font-bold">Action</th>
                  <th className="px-6 py-4 font-bold">Resource</th>
                  <th className="px-6 py-4 font-bold">Actor ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((log: any, idx: number) => (
                  <tr key={log.id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 text-xs font-medium">
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${actorColors[log.actorType] || 'bg-gray-100 text-gray-600'}`}>
                        {actorIcon(log.actorType)}
                        {log.actorType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{formatAction(log.action || '')}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {log.resourceType && (
                        <span className="font-medium capitalize">{log.resourceType}</span>
                      )}
                      {log.resourceId && (
                        <span className="block text-gray-400 font-mono text-[10px]">{log.resourceId.slice(0, 16)}...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                      {log.actorId?.slice(0, 12)}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between text-xs text-gray-500">
            <span>Showing {filtered.length} of {logs.length} events</span>
            {logs.length >= limit && (
              <button
                onClick={() => setLimit(l => l + 100)}
                className="font-bold text-orange-600 hover:underline"
              >
                Load more →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
