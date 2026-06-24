import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import {
  Grid,
  Plus,
  Edit2,
  Trash2,
  Tag,
  Search,
  X,
  RefreshCw,
  Package,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category {
  _id: string;
  name: string;
  description?: string;
  icon: string;
  sortOrder: number;
  productCount: number;
  createdAt?: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
}

// ─── Demo Fallback Data ───────────────────────────────────────────────────────

const DEMO_CATEGORIES: Category[] = [
  { _id: 'demo-1', name: 'Electronics', description: 'Phones, laptops, gadgets', icon: '📱', sortOrder: 1, productCount: 342 },
  { _id: 'demo-2', name: 'Fashion', description: 'Clothing, footwear, accessories', icon: '👗', sortOrder: 2, productCount: 891 },
  { _id: 'demo-3', name: 'Grocery', description: 'Fresh produce, daily essentials', icon: '🛒', sortOrder: 3, productCount: 1204 },
  { _id: 'demo-4', name: 'Health', description: 'Medicines, supplements, wellness', icon: '💊', sortOrder: 4, productCount: 267 },
  { _id: 'demo-5', name: 'Home & Kitchen', description: 'Furniture, cookware, decor', icon: '🏠', sortOrder: 5, productCount: 534 },
  { _id: 'demo-6', name: 'Sports', description: 'Fitness gear, outdoor equipment', icon: '⚽', sortOrder: 6, productCount: 198 },
  { _id: 'demo-7', name: 'Books', description: 'Novels, textbooks, magazines', icon: '📚', sortOrder: 7, productCount: 445 },
  { _id: 'demo-8', name: 'Toys & Games', description: 'Kids toys, board games, puzzles', icon: '🧸', sortOrder: 8, productCount: 312 },
  { _id: 'demo-9', name: 'Beauty', description: 'Skincare, makeup, fragrances', icon: '💄', sortOrder: 9, productCount: 678 },
  { _id: 'demo-10', name: 'Automotive', description: 'Car accessories, tools, parts', icon: '🚗', sortOrder: 10, productCount: 156 },
];

const EMPTY_FORM: CategoryFormData = { name: '', description: '', icon: '📦', sortOrder: 0 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeCategories = (raw: unknown[]): Category[] =>
  raw.map((c: unknown) => {
    const cat = c as Partial<Category>;
    return {
      _id: cat._id ?? String(Math.random()),
      name: cat.name ?? '',
      description: cat.description,
      icon: cat.icon ?? '📦',
      sortOrder: cat.sortOrder ?? 0,
      productCount: cat.productCount ?? 0,
      createdAt: cat.createdAt,
    };
  });

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

interface DeleteModalProps {
  category: Category;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ category, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-artz text-xl text-navy">Delete Category</h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X size={18} className="text-gray-500" />
        </button>
      </div>
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-4xl">
          {category.icon}
        </div>
        <p className="text-gray-600 font-inter text-sm text-center">
          Are you sure you want to delete <span className="font-semibold text-navy">{category.name}</span>?
          {category.productCount > 0 && (
            <span className="block text-orange-600 mt-1">
              ⚠️ This category has {category.productCount} products linked to it.
            </span>
          )}
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

// ─── Category Card ────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: Category;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onEdit, onDelete }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group">
    <div className="flex items-start justify-between mb-4">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5FEFE] to-teal/10 flex items-center justify-center text-3xl shadow-inner border border-teal/10">
        {category.icon}
      </div>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(category)}
          className="p-1.5 rounded-lg hover:bg-navy/5 transition-colors text-navy/60 hover:text-navy"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={() => onDelete(category)}
          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-400 hover:text-red-600"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
    <h3 className="font-artz text-lg text-navy mb-0.5 leading-tight">{category.name}</h3>
    {category.description && (
      <p className="text-xs text-gray-400 font-inter line-clamp-2 mb-3">{category.description}</p>
    )}
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-inter">
        <Package size={12} className="text-teal" />
        {category.productCount.toLocaleString()} products
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-400 font-inter">
        <Tag size={10} />
        #{category.sortOrder}
      </div>
    </div>
  </div>
);

// ─── Add / Edit Form ──────────────────────────────────────────────────────────

interface CategoryFormProps {
  initial?: Partial<CategoryFormData>;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  mode: 'add' | 'edit';
}

const CategoryForm: React.FC<CategoryFormProps> = ({ initial, onSubmit, onCancel, loading, mode }) => {
  const [form, setForm] = useState<CategoryFormData>({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    icon: initial?.icon ?? '📦',
    sortOrder: initial?.sortOrder ?? 0,
  });

  const handleChange = (field: keyof CategoryFormData, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-gray-600 font-inter mb-1.5">Category Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Electronics"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
          />
        </div>

        {/* Icon */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-gray-600 font-inter mb-1.5">Icon (emoji)</label>
          <div className="flex items-center gap-2">
            <span className="text-2xl w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center">
              {form.icon}
            </span>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => handleChange('icon', e.target.value)}
              placeholder="📦"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
            />
          </div>
        </div>

        {/* Description */}
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-gray-600 font-inter mb-1.5">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Short description of this category"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
          />
        </div>

        {/* Sort Order */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs font-semibold text-gray-600 font-inter mb-1.5">Sort Order</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={form.sortOrder}
              onChange={(e) => handleChange('sortOrder', Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-inter focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
            />
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => handleChange('sortOrder', Number(form.sortOrder) + 1)}
                className="p-1 rounded-t-md border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => handleChange('sortOrder', Math.max(0, Number(form.sortOrder) - 1))}
                className="p-1 rounded-b-md border border-t-0 border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
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
          {mode === 'add' ? 'Add Category' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usingDemo, setUsingDemo] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      const raw: unknown[] = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      setCategories(normalizeCategories(raw));
      setUsingDemo(false);
    } catch {
      setCategories(DEMO_CATEGORIES);
      setUsingDemo(true);
      toast('Showing demo categories — API unavailable', { icon: '🗂️' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAdd = async (data: CategoryFormData) => {
    setSubmitting(true);
    try {
      const res = await api.post('/admin/categories', {
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: data.description,
        icon: data.icon,
        sortOrder: data.sortOrder,
      });
      const newCategory: Category = res.data?.data ?? res.data;
      setCategories((prev) => [...prev, newCategory]);
      setShowAddForm(false);
      toast.success(`"${data.name}" category added`);
    } catch {
      // Demo mode: optimistically add
      if (usingDemo) {
        const fakeId = `local-${Date.now()}`;
        setCategories((prev) => [...prev, { _id: fakeId, productCount: 0, ...data }]);
        setShowAddForm(false);
        toast.success(`"${data.name}" category added (demo)`);
      } else {
        toast.error('Failed to add category');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (data: CategoryFormData) => {
    if (!editingCategory) return;
    setSubmitting(true);
    try {
      await api.put(`/admin/categories/${editingCategory._id}`, data);
      setCategories((prev) =>
        prev.map((c) => (c._id === editingCategory._id ? { ...c, ...data } : c))
      );
      setEditingCategory(null);
      toast.success(`"${data.name}" updated`);
    } catch {
      if (usingDemo) {
        setCategories((prev) =>
          prev.map((c) => (c._id === editingCategory._id ? { ...c, ...data } : c))
        );
        setEditingCategory(null);
        toast.success(`"${data.name}" updated (demo)`);
      } else {
        toast.error('Failed to update category');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/categories/${deletingCategory._id}`);
      setCategories((prev) => prev.filter((c) => c._id !== deletingCategory._id));
      toast.success(`"${deletingCategory.name}" deleted`);
    } catch {
      if (usingDemo) {
        setCategories((prev) => prev.filter((c) => c._id !== deletingCategory._id));
        toast.success(`"${deletingCategory.name}" deleted (demo)`);
      } else {
        toast.error('Failed to delete category');
      }
    } finally {
      setDeleting(false);
      setDeletingCategory(null);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5FEFE] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center shadow-lg shadow-navy/20">
            <Grid size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-artz text-2xl text-navy leading-tight">Categories</h1>
            <p className="text-sm text-gray-500 font-inter">
              {usingDemo && <span className="text-orange-500 font-medium mr-1">Demo •</span>}
              {categories.length} categories across the platform
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={16} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setShowAddForm(true); setEditingCategory(null); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-medium font-inter hover:bg-navy/90 transition-colors shadow-lg shadow-navy/20"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories…"
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

      {/* Add / Edit Form Panel */}
      {(showAddForm || editingCategory) && (
        <div className="bg-white rounded-2xl shadow-sm border border-teal/20 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
              {editingCategory ? <Edit2 size={16} /> : <Plus size={16} />}
            </div>
            <h2 className="font-artz text-lg text-navy">
              {editingCategory ? `Edit "${editingCategory.name}"` : 'Add New Category'}
            </h2>
          </div>
          <CategoryForm
            initial={editingCategory ?? EMPTY_FORM}
            onSubmit={editingCategory ? handleEdit : handleAdd}
            onCancel={() => { setShowAddForm(false); setEditingCategory(null); }}
            loading={submitting}
            mode={editingCategory ? 'edit' : 'add'}
          />
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <RefreshCw size={28} className="text-teal animate-spin" />
          <p className="text-gray-400 font-inter text-sm">Loading categories…</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-2xl border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Tag size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-inter text-sm">
            {searchQuery ? `No categories matching "${searchQuery}"` : 'No categories yet'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-xl text-sm font-medium font-inter hover:bg-navy/90 transition-colors"
            >
              <Plus size={14} />
              Add First Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
          {filteredCategories
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((cat) => (
              <CategoryCard
                key={cat._id}
                category={cat}
                onEdit={(c) => { setEditingCategory(c); setShowAddForm(false); }}
                onDelete={setDeletingCategory}
              />
            ))}
        </div>
      )}

      {/* Delete Modal */}
      {deletingCategory && (
        <DeleteModal
          category={deletingCategory}
          onConfirm={handleDelete}
          onCancel={() => setDeletingCategory(null)}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default CategoriesPage;
