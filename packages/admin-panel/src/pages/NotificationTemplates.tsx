import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import {
  Bell,
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  RefreshCw,
  Mail,
  MessageSquare,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Channels {
  email: boolean;
  sms: boolean;
  push: boolean;
}

interface NotificationTemplate {
  _id: string;
  trigger: string;
  title: string;
  body: string;
  channels: Channels;
  emailSubject?: string;
  emailHtml?: string;
  smsBody?: string;
  variables: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TemplateFormData {
  trigger: string;
  title: string;
  body: string;
  channels: Channels;
  emailSubject: string;
  emailHtml: string;
  smsBody: string;
  variables: string;
  isActive: boolean;
}

const EMPTY_FORM: TemplateFormData = {
  trigger: '',
  title: '',
  body: '',
  channels: { email: false, sms: false, push: false },
  emailSubject: '',
  emailHtml: '',
  smsBody: '',
  variables: '',
  isActive: true,
};

const normalise = (raw: unknown): NotificationTemplate => {
  const t = raw as Partial<NotificationTemplate>;
  return {
    _id: t._id ?? '',
    trigger: t.trigger ?? '',
    title: t.title ?? '',
    body: t.body ?? '',
    channels: { email: t.channels?.email ?? false, sms: t.channels?.sms ?? false, push: t.channels?.push ?? false },
    emailSubject: t.emailSubject,
    emailHtml: t.emailHtml,
    smsBody: t.smsBody,
    variables: t.variables ?? [],
    isActive: t.isActive ?? true,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
};

const normaliseList = (raw: unknown[]): NotificationTemplate[] =>
  raw.map(normalise);

const formToPayload = (f: TemplateFormData) => ({
  trigger: f.trigger.trim(),
  title: f.title.trim(),
  body: f.body.trim(),
  channels: f.channels,
  emailSubject: f.channels.email ? f.emailSubject.trim() : undefined,
  emailHtml: f.channels.email ? f.emailHtml.trim() : undefined,
  smsBody: f.channels.sms ? f.smsBody.trim() : undefined,
  variables: f.variables.split(',').map((v) => v.trim()).filter(Boolean),
  isActive: f.isActive,
});

const templateToForm = (t: NotificationTemplate): TemplateFormData => ({
  trigger: t.trigger,
  title: t.title,
  body: t.body,
  channels: { ...t.channels },
  emailSubject: t.emailSubject ?? '',
  emailHtml: t.emailHtml ?? '',
  smsBody: t.smsBody ?? '',
  variables: t.variables.join(', '),
  isActive: t.isActive,
});

interface DeleteModalProps {
  template: NotificationTemplate;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ template, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-artz text-xl text-navy">Delete Template</h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <Bell size={28} className="text-red-400" />
        </div>
        <p className="text-gray-600 font-inter text-sm text-center">
          Are you sure you want to delete <span className="font-semibold text-navy">{template.title}</span>?
          <span className="block text-xs text-gray-400 mt-1">Trigger: {template.trigger}</span>
        </p>
      </div>
      <div className="flex gap-3 mt-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors font-inter"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors font-inter disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

interface TemplateFormProps {
  initial?: Partial<TemplateFormData>;
  onSubmit: (data: TemplateFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  mode: 'add' | 'edit';
}

const TemplateForm: React.FC<TemplateFormProps> = ({ initial, onSubmit, onCancel, loading, mode }) => {
  const [form, setForm] = useState<TemplateFormData>({
    trigger: initial?.trigger ?? '',
    title: initial?.title ?? '',
    body: initial?.body ?? '',
    channels: initial?.channels ?? { email: false, sms: false, push: false },
    emailSubject: initial?.emailSubject ?? '',
    emailHtml: initial?.emailHtml ?? '',
    smsBody: initial?.smsBody ?? '',
    variables: initial?.variables ?? '',
    isActive: initial?.isActive ?? true,
  });

  const set = (field: keyof TemplateFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleChannel = (ch: keyof Channels) =>
    setForm((prev) => ({ ...prev, channels: { ...prev.channels, [ch]: !prev.channels[ch] } }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.trigger.trim()) { toast.error('Trigger is required'); return; }
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.body.trim()) { toast.error('Body is required'); return; }
    if (form.channels.email && !form.emailSubject.trim()) { toast.error('Email Subject is required when Email is enabled'); return; }
    if (form.channels.sms && !form.smsBody.trim()) { toast.error('SMS Body is required when SMS is enabled'); return; }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-gray-600 font-inter mb-1.5">Trigger *</label>
          <input
            type="text"
            value={form.trigger}
            onChange={(e) => set('trigger', e.target.value)}
            placeholder="e.g. order_placed"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
          />
          <p className="text-xs text-gray-400 mt-1 font-inter">Unique identifier, e.g. order_placed</p>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-gray-600 font-inter mb-1.5">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Order Placed Notification"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 font-inter mb-1.5">
            Body * <span className="text-gray-400 font-normal">(use {'{{variable}}'} placeholders)</span>
          </label>
          <textarea
            value={form.body}
            onChange={(e) => set('body', e.target.value)}
            placeholder="Your order {{order_id}} has been placed. {{buyer_name}}, we'll notify you when it ships."
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all resize-none"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 font-inter mb-1.5">
            Variables <span className="text-gray-400 font-normal">(comma-separated variable names)</span>
          </label>
          <input
            type="text"
            value={form.variables}
            onChange={(e) => set('variables', e.target.value)}
            placeholder="buyer_name, order_id, order_total"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
          />
        </div>

        {/* Channels */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 font-inter mb-2">Channels</label>
          <div className="flex gap-4">
            {(['email', 'sms', 'push'] as (keyof Channels)[]).map((ch) => (
              <label
                key={ch}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-inter ${
                  form.channels[ch]
                    ? 'border-teal bg-teal/5 text-teal'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={form.channels[ch]}
                  onChange={() => toggleChannel(ch)}
                  className="sr-only"
                />
                {ch === 'email' && <Mail size={14} />}
                {ch === 'sms' && <MessageSquare size={14} />}
                {ch === 'push' && <Smartphone size={14} />}
                <span className="capitalize">{ch}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Conditional email fields */}
        {form.channels.email && (
          <>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 font-inter mb-1.5">Email Subject *</label>
              <input
                type="text"
                value={form.emailSubject}
                onChange={(e) => set('emailSubject', e.target.value)}
                placeholder="Your order has been placed!"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 font-inter mb-1.5">Email HTML</label>
              <textarea
                value={form.emailHtml}
                onChange={(e) => set('emailHtml', e.target.value)}
                placeholder="<h1>Order Confirmed</h1><p>Hi {{buyer_name}}...</p>"
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all resize-none"
              />
            </div>
          </>
        )}

        {/* Conditional SMS field */}
        {form.channels.sms && (
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-600 font-inter mb-1.5">SMS Body *</label>
            <textarea
              value={form.smsBody}
              onChange={(e) => set('smsBody', e.target.value)}
              placeholder="Hi {{buyer_name}}, order {{order_id}} confirmed."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all resize-none"
            />
          </div>
        )}

        {/* Is Active */}
        <div className="col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => set('isActive', !form.isActive)}
              className={`relative w-11 h-6 rounded-full transition-all ${
                form.isActive ? 'bg-teal' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                  form.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700 font-inter">Active</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors font-inter"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 rounded-xl bg-navy text-white text-sm font-medium hover:bg-navy/90 transition-colors font-inter disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : mode === 'add' ? <Plus size={14} /> : <Edit2 size={14} />}
          {mode === 'add' ? 'Create Template' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

const NotificationTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [deleting, setDeleting] = useState<NotificationTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/notification-templates');
      const raw: unknown[] = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      setTemplates(normaliseList(raw));
    } catch {
      toast.error('Failed to load notification templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleAdd = async (data: TemplateFormData) => {
    setSubmitting(true);
    try {
      const payload = formToPayload(data);
      const res = await api.post('/notification-templates', payload);
      const created = normalise(res.data?.data);
      setTemplates((prev) => [...prev, created]);
      setShowAddForm(false);
      toast.success(`"${data.title}" template created`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (data: TemplateFormData) => {
    if (!editing) return;
    setSubmitting(true);
    try {
      const payload = formToPayload(data);
      const res = await api.put(`/notification-templates/${editing._id}`, payload);
      const updated = normalise(res.data?.data);
      setTemplates((prev) => prev.map((t) => (t._id === editing._id ? updated : t)));
      setEditing(null);
      toast.success(`"${data.title}" updated`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/notification-templates/${deleting._id}`);
      setTemplates((prev) => prev.filter((t) => t._id !== deleting._id));
      toast.success(`"${deleting.title}" deleted`);
      setDeleting(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete template');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = templates.filter(
    (t) =>
      t.trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
            <Bell size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-artz text-2xl text-navy leading-tight">Notification Templates</h1>
            <p className="text-sm text-gray-500 font-inter">
              {templates.length} template{templates.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchTemplates}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setShowAddForm(true); setEditing(null); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium font-inter hover:bg-navy/90 transition-colors shadow-lg shadow-navy/20"
          >
            <Plus size={16} />
            Create Template
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Create / Edit Form Panel */}
      {(showAddForm || editing) && (
        <div className="bg-white rounded-2xl shadow-sm border border-teal/20 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
              {editing ? <Edit2 size={16} /> : <Plus size={16} />}
            </div>
            <h2 className="font-artz text-lg text-navy">
              {editing ? `Edit "${editing.title}"` : 'Create Notification Template'}
            </h2>
          </div>
          <TemplateForm
            initial={editing ? templateToForm(editing) : EMPTY_FORM}
            onSubmit={editing ? handleEdit : handleAdd}
            onCancel={() => { setShowAddForm(false); setEditing(null); }}
            loading={submitting}
            mode={editing ? 'edit' : 'add'}
          />
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw size={28} className="text-teal animate-spin" />
          <p className="text-gray-400 font-inter text-sm">Loading templates…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-inter text-sm">
            {searchQuery ? `No templates matching "${searchQuery}"` : 'No notification templates yet'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-sm font-medium font-inter hover:bg-navy/90 transition-colors"
            >
              <Plus size={14} />
              Create First Template
            </button>
          )}
        </div>
      ) : (
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-4 py-3 font-poppins font-bold text-xs text-slate-500">Trigger</th>
                <th className="text-left px-4 py-3 font-poppins font-bold text-xs text-slate-500">Title</th>
                <th className="text-center px-4 py-3 font-poppins font-bold text-xs text-slate-500">Active</th>
                <th className="text-center px-4 py-3 font-poppins font-bold text-xs text-slate-500">Channels</th>
                <th className="text-right px-4 py-3 font-poppins font-bold text-xs text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-inter text-sm text-slate-700 font-medium">{t.trigger}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-inter text-sm text-slate-700">{t.title}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {t.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <Eye size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                        <EyeOff size={12} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {t.channels.email && (
                        <span className="inline-flex items-center gap-1 text-xs text-teal bg-teal/5 px-2 py-1 rounded-full">
                          <Mail size={11} /> Email
                        </span>
                      )}
                      {t.channels.sms && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                          <MessageSquare size={11} /> SMS
                        </span>
                      )}
                      {t.channels.push && (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-500 bg-purple-50 px-2 py-1 rounded-full">
                          <Smartphone size={11} /> Push
                        </span>
                      )}
                      {!t.channels.email && !t.channels.sms && !t.channels.push && (
                        <span className="text-xs text-gray-400 font-inter">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => { setEditing(t); setShowAddForm(false); }}
                        className="p-1.5 rounded-lg hover:bg-navy/5 transition-colors text-navy/60 hover:text-navy"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleting(t)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      {deleting && (
        <DeleteModal
          template={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};

export default NotificationTemplates;
