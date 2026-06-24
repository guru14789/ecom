import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Package, ChevronDown, ChevronUp,
  Upload, Image, GripVertical, Save, Send, Globe
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

interface Variant {
  id: string;
  label: string;
  type: 'size' | 'color' | 'storage' | 'pack';
  stock: number;
  priceModifier: number;
  sku?: string;
  image?: string;
}

interface Spec {
  label: string;
  value: string;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  brand?: string;
  tags?: string[];
  price: number;
  groupPrice: number;
  mrp?: number;
  stock: number;
  image: string;
  images?: string[];
  specs?: Spec[];
  highlights?: string[];
  variants?: Variant[];
  returnPolicy?: string;
  warranty?: string;
  deliveryTime?: string;
  badge?: string;
  hsnCode?: string;
  countryOfOrigin?: string;
  shippingWeight?: number;
  shippingLength?: number;
  shippingWidth?: number;
  shippingHeight?: number;
  isFragile?: boolean;
  videoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

const VARIANT_TYPES = ['size', 'color', 'storage', 'pack'] as const;

function FormInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="text-xs font-inter font-semibold text-[#6B8FA3] mb-1.5 block">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-3 bg-white border border-[#01406D] rounded-xl text-sm font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30 focus:border-[#01B4BA] transition-all placeholder:text-[#9CA3AF]"
      />
    </div>
  );
}

function FormSelect({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div>
      <label className="text-xs font-inter font-semibold text-[#6B8FA3] mb-1.5 block">{label}</label>
      <select
        {...props}
        className="w-full px-4 py-3 bg-white border border-[#01406D] rounded-xl text-sm font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30 focus:border-[#01B4BA] transition-all"
      >
        {children}
      </select>
    </div>
  );
}

function FormTextarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div>
      <label className="text-xs font-inter font-semibold text-[#6B8FA3] mb-1.5 block">{label}</label>
      <textarea
        {...props}
        className="w-full px-4 py-3 bg-white border border-[#01406D] rounded-xl text-sm font-inter outline-none focus:ring-2 focus:ring-[#01B4BA]/30 focus:border-[#01B4BA] transition-all placeholder:text-[#9CA3AF] resize-none"
      />
    </div>
  );
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showShipping, setShowShipping] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', category: '', subcategory: '', brand: '', tags: '',
    price: '', groupPrice: '', mrp: '', stock: '0', image: '', images: '',
    returnPolicy: '', warranty: '', deliveryTime: '', badge: '',
    hsnCode: '', countryOfOrigin: 'India',
    shippingWeight: '', shippingLength: '', shippingWidth: '', shippingHeight: '',
    isFragile: false,
    videoUrl: '',
  });

  const [variants, setVariants] = useState<Variant[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/vendor/products');
      setProducts(res.data.data || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const resetForm = () => {
    setForm({
      name: '', description: '', category: '', subcategory: '', brand: '', tags: '',
      price: '', groupPrice: '', mrp: '', stock: '0', image: '', images: '',
      returnPolicy: '', warranty: '', deliveryTime: '', badge: '',
      hsnCode: '', countryOfOrigin: 'India',
      shippingWeight: '', shippingLength: '', shippingWidth: '', shippingHeight: '',
      isFragile: false, videoUrl: '',
    });
    setVariants([]);
    setSpecs([]);
    setHighlights([]);
    setShowVariants(false);
    setShowSpecs(false);
    setShowHighlights(false);
    setShowShipping(false);
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || '',
      category: product.category,
      subcategory: product.subcategory || '',
      brand: product.brand || '',
      tags: (product.tags || []).join(', '),
      price: String(product.price),
      groupPrice: String(product.groupPrice),
      mrp: product.mrp ? String(product.mrp) : '',
      stock: String(product.stock),
      image: product.image || '',
      images: (product.images || []).join(', '),
      returnPolicy: product.returnPolicy || '',
      warranty: product.warranty || '',
      deliveryTime: product.deliveryTime || '',
      badge: product.badge || '',
      hsnCode: product.hsnCode || '',
      countryOfOrigin: product.countryOfOrigin || 'India',
      shippingWeight: product.shippingWeight ? String(product.shippingWeight) : '',
      shippingLength: product.shippingLength ? String(product.shippingLength) : '',
      shippingWidth: product.shippingWidth ? String(product.shippingWidth) : '',
      shippingHeight: product.shippingHeight ? String(product.shippingHeight) : '',
      isFragile: product.isFragile ?? false,
      videoUrl: product.videoUrl || '',
    });
    setVariants(product.variants || []);
    setSpecs(product.specs || []);
    setHighlights(product.highlights || []);
    setShowForm(true);
    setShowVariants((product.variants || []).length > 0);
    setShowSpecs((product.specs || []).length > 0);
    setShowHighlights((product.highlights || []).length > 0);
    setShowShipping(!!(product.shippingWeight || product.shippingLength));
  };

  const buildPayload = (status: 'draft' | 'review' | 'active') => ({
    name: form.name,
    description: form.description,
    category: form.category,
    subcategory: form.subcategory || undefined,
    brand: form.brand || undefined,
    tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    price: parseFloat(form.price),
    groupPrice: parseFloat(form.groupPrice) || parseFloat(form.price),
    mrp: form.mrp ? parseFloat(form.mrp) : undefined,
    stock: parseInt(form.stock) || 0,
    image: form.image || 'https://via.placeholder.com/400',
    images: form.images ? form.images.split(',').map((u: string) => u.trim()).filter(Boolean) : [],
    specs: specs.filter((s) => s.label && s.value),
    highlights: highlights.filter(Boolean),
    variants: variants.filter((v) => v.label),
    returnPolicy: form.returnPolicy || undefined,
    warranty: form.warranty || undefined,
    deliveryTime: form.deliveryTime || undefined,
    badge: form.badge || undefined,
    hsnCode: form.hsnCode || undefined,
    countryOfOrigin: form.countryOfOrigin || undefined,
    shippingWeight: form.shippingWeight ? parseFloat(form.shippingWeight) : undefined,
    shippingLength: form.shippingLength ? parseFloat(form.shippingLength) : undefined,
    shippingWidth: form.shippingWidth ? parseFloat(form.shippingWidth) : undefined,
    shippingHeight: form.shippingHeight ? parseFloat(form.shippingHeight) : undefined,
    isFragile: form.isFragile,
    videoUrl: form.videoUrl || undefined,
    status,
  });

  const handleSave = async (status: 'draft' | 'review' | 'active') => {
    if (!form.name || !form.price || !form.category) {
      toast.error('Name, price, and category are required');
      return;
    }
    if (form.mrp && parseFloat(form.price) > parseFloat(form.mrp)) {
      toast.error('Selling price cannot be greater than MRP');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload(status);
      if (editing) {
        await api.put(`/vendor/products/${editing._id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/vendor/products', payload);
        toast.success('Product created');
      }
      setShowForm(false);
      setEditing(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/vendor/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const addVariant = () => {
    setVariants([...variants, { id: `v${Date.now()}`, label: '', type: 'size', stock: 0, priceModifier: 0 }]);
  };
  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const updated = [...variants];
    (updated[index] as any)[field] = value;
    setVariants(updated);
  };
  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };
  const addSpec = () => setSpecs([...specs, { label: '', value: '' }]);
  const updateSpec = (index: number, field: keyof Spec, value: string) => {
    const updated = [...specs];
    updated[index][field] = value;
    setSpecs(updated);
  };
  const removeSpec = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
  const addHighlight = () => setHighlights([...highlights, '']);
  const updateHighlight = (index: number, value: string) => {
    const updated = [...highlights];
    updated[index] = value;
    setHighlights(updated);
  };
  const removeHighlight = (index: number) => setHighlights(highlights.filter((_, i) => i !== index));

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-artz font-bold text-[#01406D]">Products</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#01406D] text-white px-5 py-2.5 rounded-[6px] text-sm font-inter font-bold min-h-[44px] hover:bg-[#012a4a] transition-colors duration-150"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* ─── Product Form ─── */}
      {showForm && (
        <div className="bg-white border border-[#E0EFEF] rounded-2xl mb-6 overflow-hidden shadow-sm animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E0EFEF]">
            <h2 className="font-artz font-bold text-[#01406D] text-lg">
              {editing ? 'Edit Product' : 'New Product'}
            </h2>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="p-2 hover:bg-[#F5FEFE] rounded-xl transition-colors">
              <X size={16} className="text-[#6B8FA3]" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Section: Basic Information */}
            <div>
              <h3 className="font-artz font-bold text-[#01406D] text-sm mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormInput label="Product Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wireless Bluetooth Headphones" />
                <FormInput label="Category *" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Electronics" />
                <FormInput label="Subcategory" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} placeholder="e.g. Audio" />
                <FormInput label="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. Sony" />
                <FormInput label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="new, trending, sale" />
                <FormInput label="HSN Code" value={form.hsnCode} onChange={(e) => setForm({ ...form, hsnCode: e.target.value })} placeholder="8 digit HSN" maxLength={8} />
                <FormInput label="Country of Origin" value={form.countryOfOrigin} onChange={(e) => setForm({ ...form, countryOfOrigin: e.target.value })} placeholder="India" />
                <FormSelect label="Badge" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}>
                  <option value="">None</option>
                  <option value="bestseller">Bestseller</option>
                  <option value="new">New</option>
                  <option value="trending">Trending</option>
                  <option value="limited">Limited</option>
                  <option value="deal">Deal</option>
                </FormSelect>
              </div>
              <div className="mt-4">
                <FormTextarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Product description..." />
              </div>
            </div>

            {/* Section: Pricing & Stock */}
            <hr className="border-[#E0EFEF]" />
            <div>
              <h3 className="font-artz font-bold text-[#01406D] text-sm mb-4">Pricing &amp; Stock</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormInput label="Selling Price (₹) *" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} min={1} placeholder="0" />
                <FormInput label="MRP (₹)" type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} min={0} placeholder="0" />
                <FormInput label="Group Price (₹)" type="number" value={form.groupPrice} onChange={(e) => setForm({ ...form, groupPrice: e.target.value })} min={1} placeholder="0" />
                <FormInput label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} min={0} placeholder="0" />
              </div>
            </div>

            {/* Section: Media */}
            <hr className="border-[#E0EFEF]" />
            <div>
              <h3 className="font-artz font-bold text-[#01406D] text-sm mb-4">Media</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-inter font-semibold text-[#6B8FA3] mb-1.5 block">Main Image</label>
                  <div className="border-2 border-dashed border-[#01B4BA] rounded-xl p-6 text-center hover:bg-[#F5FEFE]/50 transition-colors cursor-pointer group"
                    onClick={() => {
                      const url = window.prompt('Enter image URL:');
                      if (url) setForm({ ...form, image: url });
                    }}
                  >
                    {form.image ? (
                      <div className="relative inline-block">
                        <img src={form.image} alt="Preview" className="w-24 h-24 object-contain mx-auto rounded-lg" />
                        <button onClick={(e) => { e.stopPropagation(); setForm({ ...form, image: '' }); }}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                          <X size={10} />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload size={28} className="mx-auto mb-2 text-[#01B4BA] group-hover:scale-110 transition-transform" />
                        <p className="text-xs font-inter text-[#6B8FA3]">Click to add image URL</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <FormInput label="Additional Images (comma separated URLs)" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="url1, url2, url3" />
                  {form.images && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {form.images.split(',').slice(0, 4).map((url, i) => (
                        url.trim() ? <img key={i} src={url.trim()} alt="" className="w-12 h-12 object-contain rounded-lg border border-[#E0EFEF]" /> : null
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <FormInput label="Video URL" value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="YouTube or Vimeo URL (optional)" />
              </div>
            </div>

            {/* Section: Shipping Details */}
            <hr className="border-[#E0EFEF]" />
            <div className="border border-[#E0EFEF] rounded-xl overflow-hidden">
              <button type="button" onClick={() => setShowShipping(!showShipping)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-[#F5FEFE] text-sm font-inter font-bold text-[#01406D] transition-colors hover:bg-[#E0EFEF]/30"
              >
                Shipping Details {showShipping ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showShipping && (
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    <FormInput label="Weight (g)" type="number" value={form.shippingWeight} onChange={(e) => setForm({ ...form, shippingWeight: e.target.value })} min={0} />
                    <FormInput label="Length (cm)" type="number" value={form.shippingLength} onChange={(e) => setForm({ ...form, shippingLength: e.target.value })} min={0} />
                    <FormInput label="Width (cm)" type="number" value={form.shippingWidth} onChange={(e) => setForm({ ...form, shippingWidth: e.target.value })} min={0} />
                    <FormInput label="Height (cm)" type="number" value={form.shippingHeight} onChange={(e) => setForm({ ...form, shippingHeight: e.target.value })} min={0} />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isFragile} onChange={(e) => setForm({ ...form, isFragile: e.target.checked })}
                      className="rounded border-[#01406D] text-[#01B4BA] focus:ring-[#01B4BA]/30" />
                    <span className="text-xs font-inter font-semibold text-[#6B8FA3]">Fragile item — handle with care</span>
                  </label>
                </div>
              )}
            </div>

            {/* Section: Variants */}
            <hr className="border-[#E0EFEF]" />
            <div className="border border-[#E0EFEF] rounded-xl overflow-hidden">
              <button type="button" onClick={() => setShowVariants(!showVariants)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-[#F5FEFE] text-sm font-inter font-bold text-[#01406D] transition-colors hover:bg-[#E0EFEF]/30"
              >
                Variants ({variants.length}) {showVariants ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showVariants && (
                <div className="p-5">
                  {variants.length > 0 && (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-xs font-inter">
                        <thead>
                          <tr className="bg-[#F5FEFE] border-b border-[#E0EFEF]">
                            <th className="text-left px-3 py-2 font-bold text-[#6B8FA3] uppercase">Type</th>
                            <th className="text-left px-3 py-2 font-bold text-[#6B8FA3] uppercase">Label</th>
                            <th className="text-left px-3 py-2 font-bold text-[#6B8FA3] uppercase">SKU</th>
                            <th className="text-left px-3 py-2 font-bold text-[#6B8FA3] uppercase">Image</th>
                            <th className="text-center px-3 py-2 font-bold text-[#6B8FA3] uppercase">Stock</th>
                            <th className="text-center px-3 py-2 font-bold text-[#6B8FA3] uppercase">Price ±</th>
                            <th className="text-center px-3 py-2 font-bold text-[#6B8FA3] uppercase" />
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map((v, i) => (
                            <tr key={v.id} className="border-b border-[#E0EFEF] last:border-0 hover:bg-[#F5FEFE]/30">
                              <td className="px-3 py-2">
                                <select value={v.type} onChange={(e) => updateVariant(i, 'type', e.target.value)}
                                  className="w-full px-2 py-1.5 border border-[#01406D] rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-[#01B4BA]/30">
                                  {VARIANT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input value={v.label} onChange={(e) => updateVariant(i, 'label', e.target.value)}
                                  placeholder="e.g. Red / XL"
                                  className="w-full px-2 py-1.5 border border-[#01406D] rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#01B4BA]/30" />
                              </td>
                              <td className="px-3 py-2">
                                <input value={v.sku || ''} onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                                  placeholder="SKU-001"
                                  className="w-full px-2 py-1.5 border border-[#01406D] rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#01B4BA]/30" />
                              </td>
                              <td className="px-3 py-2">
                                <input value={v.image || ''} onChange={(e) => updateVariant(i, 'image', e.target.value)}
                                  placeholder="Image URL"
                                  className="w-full px-2 py-1.5 border border-[#01406D] rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#01B4BA]/30" />
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" value={v.stock} onChange={(e) => updateVariant(i, 'stock', parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1.5 border border-[#01406D] rounded-lg text-xs text-center outline-none focus:ring-2 focus:ring-[#01B4BA]/30" />
                              </td>
                              <td className="px-3 py-2">
                                <input type="number" value={v.priceModifier} onChange={(e) => updateVariant(i, 'priceModifier', parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1.5 border border-[#01406D] rounded-lg text-xs text-center outline-none focus:ring-2 focus:ring-[#01B4BA]/30" />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <button onClick={() => removeVariant(i)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 size={13} className="text-red-400" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <button type="button" onClick={addVariant}
                    className="flex items-center gap-1 text-xs font-inter font-bold text-[#01B4BA] hover:underline">
                    <Plus size={12} /> Add Variant
                  </button>
                </div>
              )}
            </div>

            {/* Section: Specifications */}
            <hr className="border-[#E0EFEF]" />
            <div className="border border-[#E0EFEF] rounded-xl overflow-hidden">
              <button type="button" onClick={() => setShowSpecs(!showSpecs)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-[#F5FEFE] text-sm font-inter font-bold text-[#01406D] transition-colors hover:bg-[#E0EFEF]/30"
              >
                Specifications ({specs.length}) {showSpecs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showSpecs && (
                <div className="p-5 space-y-3">
                  {specs.map((s, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input value={s.label} onChange={(e) => updateSpec(i, 'label', e.target.value)}
                        placeholder="Label (e.g. Processor)"
                        className="flex-1 px-3 py-2 border border-[#01406D] rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#01B4BA]/30" />
                      <input value={s.value} onChange={(e) => updateSpec(i, 'value', e.target.value)}
                        placeholder="Value (e.g. Intel i7)"
                        className="flex-1 px-3 py-2 border border-[#01406D] rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#01B4BA]/30" />
                      <button onClick={() => removeSpec(i)} className="p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addSpec} className="flex items-center gap-1 text-xs font-inter font-bold text-[#01B4BA] hover:underline">
                    <Plus size={12} /> Add Specification
                  </button>
                </div>
              )}
            </div>

            {/* Section: Highlights */}
            <hr className="border-[#E0EFEF]" />
            <div className="border border-[#E0EFEF] rounded-xl overflow-hidden">
              <button type="button" onClick={() => setShowHighlights(!showHighlights)}
                className="w-full flex items-center justify-between px-5 py-3.5 bg-[#F5FEFE] text-sm font-inter font-bold text-[#01406D] transition-colors hover:bg-[#E0EFEF]/30"
              >
                Highlights ({highlights.length}) {showHighlights ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {showHighlights && (
                <div className="p-5 space-y-3">
                  {highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input value={h} onChange={(e) => updateHighlight(i, e.target.value)}
                        placeholder="Highlight text"
                        className="flex-1 px-3 py-2 border border-[#01406D] rounded-lg text-xs outline-none focus:ring-2 focus:ring-[#01B4BA]/30" />
                      <button onClick={() => removeHighlight(i)} className="p-1.5 hover:bg-red-50 rounded-lg">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                  ))}
                  <button onClick={addHighlight} className="flex items-center gap-1 text-xs font-inter font-bold text-[#01B4BA] hover:underline">
                    <Plus size={12} /> Add Highlight
                  </button>
                </div>
              )}
            </div>

            {/* Section: Return Policy & Warranty */}
            <hr className="border-[#E0EFEF]" />
            <div>
              <h3 className="font-artz font-bold text-[#01406D] text-sm mb-4">Policies</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormInput label="Return Policy" value={form.returnPolicy} onChange={(e) => setForm({ ...form, returnPolicy: e.target.value })} placeholder="7 days return" />
                <FormInput label="Warranty" value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} placeholder="1 year warranty" />
                <FormInput label="Delivery Time" value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} placeholder="3-5 business days" />
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="px-6 py-4 bg-[#F5FEFE] border-t border-[#E0EFEF] flex items-center justify-end gap-3">
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-[6px] text-sm font-inter font-bold text-[#01406D] border border-[#01406D] min-h-[44px] hover:bg-[#01406D]/5 transition-colors duration-150 disabled:opacity-50"
            >
              <Save size={15} /> Save Draft
            </button>
            <button
              onClick={() => handleSave('review')}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-[6px] text-sm font-inter font-bold bg-[#01B4BA] text-white min-h-[44px] hover:bg-[#019aa0] transition-colors duration-150 disabled:opacity-50"
            >
              <Send size={15} /> Submit for Review
            </button>
            <button
              onClick={() => handleSave('active')}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-[6px] text-sm font-inter font-bold bg-[#FF7A0F] text-white min-h-[44px] hover:bg-[#e06b0d] transition-colors duration-150 disabled:opacity-50"
            >
              <Globe size={15} /> Publish
            </button>
          </div>
        </div>
      )}

      {/* ─── Products Table ─── */}
      <div className="bg-white border border-[#E0EFEF] rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E0EFEF]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B8FA3]" size={15} />
            <input
              type="text" placeholder="Search products..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#F5FEFE] border border-[#E0EFEF] rounded-xl text-xs font-inter outline-none focus:border-[#01B4BA] transition-colors"
            />
          </div>
          <span className="text-xs font-inter text-[#6B8FA3]">{filtered.length} products</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#01B4BA] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#6B8FA3]">
            <Package size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm font-inter">No products found. Create your first product!</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5FEFE] border-b border-[#E0EFEF]">
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Product</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Category</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Price</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Stock</th>
                <th className="text-left px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Variants</th>
                <th className="text-right px-5 py-3 text-xs font-inter font-bold text-[#6B8FA3] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id} className="border-b border-[#E0EFEF] hover:bg-[#F5FEFE]/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-[#F5FEFE]" />
                      <div>
                        <span className="text-sm font-inter font-medium text-[#01406D] block">{p.name}</span>
                        {p.badge && <span className="text-[10px] font-inter font-bold text-[#01B4BA] uppercase">{p.badge}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-inter text-[#6B8FA3]">{p.category}{p.subcategory ? ` / ${p.subcategory}` : ''}</td>
                  <td className="px-5 py-4 text-sm font-inter">
                    <span className="font-bold text-[#01406D]">₹{p.price}</span>
                    {p.mrp && p.mrp > p.price && <span className="text-xs text-[#9CA3AF] line-through ml-1">₹{p.mrp}</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-inter font-semibold ${p.stock < 10 ? 'text-[#FF7A0F]' : 'text-[#01406D]'}`}>{p.stock}</span>
                  </td>
                  <td className="px-5 py-4 text-xs font-inter text-[#6B8FA3]">{(p.variants || []).length}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-2 hover:bg-[#F5FEFE] rounded-lg transition-colors">
                        <Edit2 size={14} className="text-[#6B8FA3]" />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} className="text-[#FF7A0F]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Products;
