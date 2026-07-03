import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { CATEGORY_DATA } from '../../data/categories';

export const VendorProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    mrp: '',
    stock: '',
    unit: '1 Unit',
    mainCategory: '',
    subCategory: '',
    imageUrl: '', // Simple URL input for MVP to avoid complex storage rules issues
    isAvailable: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('You must be logged in as a vendor.');

    try {
      setIsSubmitting(true);
      toast.loading('Saving product...', { id: 'save-product' });

      const price = parseFloat(formData.price);
      const mrp = parseFloat(formData.mrp);
      const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      const productData = {
        vendorId: user.uid,
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/\\s+/g, '-'),
        description: formData.description,
        price,
        mrp,
        discountPercent,
        stock: parseInt(formData.stock),
        unit: formData.unit,
        category: formData.mainCategory,
        subcategory: formData.subCategory,
        images: formData.imageUrl ? [formData.imageUrl] : [],
        isAvailable: formData.isAvailable,
        isFeatured: false,
        rating: 0,
        reviewCount: 0,
        tags: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'products'), productData);

      toast.success('Product added successfully!', { id: 'save-product' });
      navigate('/vendor/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product', { id: 'save-product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMainCat = CATEGORY_DATA.find(c => c.slug === formData.mainCategory);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/vendor/products')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
          <h3 className="font-bold text-lg border-b pb-2">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Product Name <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="name" 
                required 
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
                placeholder="e.g. Apple iPhone 15 Pro" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Unit / Quantity <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="unit" 
                required 
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
                placeholder="e.g. 1 Unit, 500g, 1L" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Main Category <span className="text-red-500">*</span></label>
              <select 
                name="mainCategory" 
                required 
                value={formData.mainCategory}
                onChange={(e) => {
                  handleChange(e);
                  setFormData(prev => ({ ...prev, subCategory: '' })); // Reset subcategory when main changes
                }}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="">Select Category...</option>
                {CATEGORY_DATA.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sub Category <span className="text-red-500">*</span></label>
              <select 
                name="subCategory" 
                required 
                disabled={!formData.mainCategory}
                value={formData.subCategory}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-white disabled:bg-gray-50"
              >
                <option value="">Select Subcategory...</option>
                {selectedMainCat?.subcategories?.map(sub => (
                  <option key={sub.id} value={sub.slug}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea 
              name="description" 
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none resize-none" 
              placeholder="Describe your product..." 
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
          <h3 className="font-bold text-lg border-b pb-2">Pricing & Inventory</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Selling Price (₹) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                name="price" 
                required 
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">MRP (₹) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                name="mrp" 
                required 
                min="0"
                step="0.01"
                value={formData.mrp}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Stock Quantity <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                name="stock" 
                required 
                min="0"
                value={formData.stock}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
          <h3 className="font-bold text-lg border-b pb-2">Product Image</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Image URL</label>
            <div className="flex gap-4 items-center">
              <input 
                type="url" 
                name="imageUrl" 
                value={formData.imageUrl}
                onChange={handleChange}
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
                placeholder="https://example.com/image.jpg" 
              />
              <div className="w-12 h-12 rounded border bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <UploadCloud className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500">Provide a direct link to an image for now.</p>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button 
            type="button"
            onClick={() => navigate('/vendor/products')}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-xl font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
