import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../lib/api';
import { Briefcase, Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, RefreshCw, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminJobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);

  const [form, setForm] = useState({
    role: '',
    dept: 'Engineering',
    location: '',
    isActive: true,
  });

  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: async () => {
      const res = await adminApi.jobs.list();
      return res.data;
    },
  });

  const jobs = response || [];

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => adminApi.jobs.create(data),
    onSuccess: () => {
      toast.success('Job listing created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      setShowModal(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to create job'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof form }) => adminApi.jobs.update(id, data),
    onSuccess: () => {
      toast.success('Job listing updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
      setShowModal(false);
      setEditingJob(null);
      resetForm();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update job'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.jobs.delete(id),
    onSuccess: () => {
      toast.success('Job listing deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete job'),
  });

  const resetForm = () => {
    setForm({ role: '', dept: 'Engineering', location: '', isActive: true });
  };

  const handleEditClick = (job: any) => {
    setEditingJob(job);
    setForm({
      role: job.role,
      dept: job.dept,
      location: job.location,
      isActive: job.isActive,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Are you sure you want to delete this job listing?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role || !form.location) {
      toast.error('All fields are required');
      return;
    }
    if (editingJob) {
      updateMutation.mutate({ id: editingJob.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const filteredJobs = jobs.filter((job: any) =>
    job.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-blue-950 tracking-tight">Careers Openings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage public job openings, departments, and hiring statuses.</p>
        </div>
        <button
          onClick={() => { setEditingJob(null); resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all relative z-10"
        >
          <Plus className="w-4 h-4" /> Add New Job
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search job listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
          />
        </div>
        <button onClick={() => refetch()} className="text-gray-400 hover:text-gray-600">
          <RefreshCw className="w-4 h-4 animate-spin" style={{ animationDuration: '3s' }} />
        </button>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/80 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Role Title</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Department</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Location</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading openings...</td></tr>
              ) : filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-500">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-900">No jobs listed</h3>
                    <p className="text-sm">Create job listing openings to hire builders.</p>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{job.role}</td>
                    <td className="px-6 py-4 text-slate-600">{job.dept}</td>
                    <td className="px-6 py-4 text-slate-600">{job.location}</td>
                    <td className="px-6 py-4">
                      {job.isActive ? (
                        <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold">ACTIVE</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-bold">CLOSED</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditClick(job)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-all">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteClick(job.id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-6 border">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-black text-blue-950">{editingJob ? 'Edit Career Opening' : 'Add Career Opening'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  value={form.role}
                  onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all"
                  placeholder="e.g. Senior Frontend Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Department</label>
                <select
                  value={form.dept}
                  onChange={(e) => setForm(p => ({ ...p, dept: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="Support">Support</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all"
                  placeholder="e.g. Remote / Bangalore"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700">Set Active (Visible on Careers Page)</label>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {editingJob ? 'Save Changes' : 'Publish Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
