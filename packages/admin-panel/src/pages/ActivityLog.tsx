import React, { useEffect, useState } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Activity {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  performed_by: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

const ActivityLog: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/activity-log?page=${page}&limit=30`);
      setActivities(res.data.data);
      setTotalPages(res.data.pagination.pages || 1);
    } catch {
      toast.error('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchActivities(); }, [page]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-navy">Activity Log</h1>
        <button onClick={fetchActivities} className="flex items-center gap-2 text-sm text-teal font-semibold hover:underline">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-slate-50/50">
                <div className="w-10 h-10 bg-navy/5 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
                  <Clock size={18} className="text-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    <span className="font-semibold">{activity.action}</span>
                    {' on '}
                    <span className="text-teal">{activity.entity_type}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">ID: {activity.entity_id}</p>
                  {activity.metadata && (
                    <pre className="text-xs text-slate-400 mt-1 bg-slate-50 p-2 rounded-lg overflow-x-auto">
                      {JSON.stringify(activity.metadata, null, 2)}
                    </pre>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">
                    {new Date(activity.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(activity.created_at).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{activity.performed_by}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">No activity recorded yet</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-slate-100">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm text-slate-600 hover:text-navy disabled:opacity-30"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-sm text-slate-600 hover:text-navy disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityLog;
