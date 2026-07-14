import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, UploadCloud } from 'lucide-react';
import { collection, addDoc, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { CATEGORY_DATA } from '../../data/categories';
import { z } from 'zod';

export const VendorProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);

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
    taxRate: '18',
    taxInclusive: true,
    isAvailable: true,
    productType: 'physical',
    digitalFileUrl: '',
    isSubscriptionEligible: false,
    subscriptionDiscount: '10',
  });

  useEffect(() => {
    if (!id || !user) return;

    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const expectedVendorId = user.vendorId || user.uid;
          if (data.vendorId !== expectedVendorId && data.vendorId !== user.uid) {
            toast.error('You do not have permission to edit this product.');
            navigate('/vendor/products');
            return;
          }
          
          setFormData({
            name: data.name || '',
            description: data.description || '',
            price: data.price?.toString() || '',
            mrp: data.mrp?.toString() || '',
            stock: data.stock?.toString() || '0',
            unit: data.unit || '1 Unit',
            mainCategory: data.category || '',
            subCategory: data.subcategory || '',
            imageUrl: data.images?.[0] || '',
            taxRate: data.taxRate?.toString() || '18',
            taxInclusive: data.taxInclusive ?? true,
            isAvailable: data.isAvailable ?? true,
            productType: data.productType || 'physical',
            digitalFileUrl: data.digitalFileUrl || '',
            isSubscriptionEligible: data.isSubscriptionEligible || false,
            subscriptionDiscount: data.subscriptionDiscount?.toString() || '10',
          });
        } else {
          toast.error('Product not found');
          navigate('/vendor/products');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, user, navigate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      toast.loading('Uploading image...', { id: 'upload-image' });

      // 1. Get Cloudflare Direct Upload URL from backend
      const { auth } = await import('../../lib/firebase');
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/vendor/upload/cloudflare-url`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, imageId, hash } = await response.json();

      // 2. Upload the file to Cloudflare directly
      const formData = new FormData();
      formData.append('file', file);

      const cfResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!cfResponse.ok) throw new Error('Failed to upload image to Cloudflare');
      
      // 3. Construct public URL using the returned hash and ID
      const publicUrl = `https://imagedelivery.net/${hash}/${imageId}/public`;
      
      setFormData(prev => ({ ...prev, imageUrl: publicUrl }));
      toast.success('Image uploaded successfully!', { id: 'upload-image' });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image', { id: 'upload-image' });
    } finally {
      setIsUploadingImage(false);
    }
  };

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
      const stock = parseInt(formData.stock);
      const discountPercent = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

      const productSchema = z.object({
        name: z.string().min(3, 'Product name must be at least 3 characters'),
        price: z.number().positive('Price must be greater than 0'),
        mrp: z.number().positive('MRP must be greater than 0'),
        stock: z.number().int().min(0, 'Stock cannot be negative'),
        mainCategory: z.string().min(1, 'Please select a main category'),
      }).refine(data => data.mrp >= data.price, {
        message: 'MRP must be greater than or equal to Price',
        path: ['mrp'],
      });

      productSchema.parse({
        name: formData.name,
        price,
        mrp,
        stock,
        mainCategory: formData.mainCategory
      });

      const productData = {
        vendorId: user.vendorId || user.uid,
        name: formData.name,
        slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
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
        taxRate: parseFloat(formData.taxRate) || 0,
        taxInclusive: formData.taxInclusive,
        productType: formData.productType,
        digitalFileUrl: formData.productType === 'digital' ? formData.digitalFileUrl : null,
        isSubscriptionEligible: formData.isSubscriptionEligible,
        subscriptionDiscount: parseFloat(formData.subscriptionDiscount) || 0,
        isFeatured: false,
        isActive: true, // IMPORTANT: Without this, products won't show on buyer page
        rating: 0,
        reviewCount: 0,
        tags: [],
        updatedAt: serverTimestamp()
      };

      if (id) {
        // Update existing product
        await updateDoc(doc(db, 'products', id), productData);
        toast.success('Product updated successfully!', { id: 'save-product' });
      } else {
        // Create new product
        const newProductData = {
          ...productData,
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'products'), newProductData);
        toast.success('Product added successfully!', { id: 'save-product' });
      }

      navigate('/vendor/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message, { id: 'save-product' });
      } else {
        toast.error(error.message || 'Failed to save product', { id: 'save-product' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMainCat = CATEGORY_DATA.find(c => c.slug === formData.mainCategory);

  if (isLoading) {
    return <div className="p-12 text-center text-gray-500">Loading product details...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/vendor/products')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900">{id ? 'Edit Product' : 'Add New Product'}</h2>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Product Type <span className="text-red-500">*</span></label>
              <select 
                name="productType" 
                required 
                value={formData.productType}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="physical">Physical Product</option>
                <option value="digital">Digital Product (Downloadable)</option>
              </select>
            </div>
            
            {formData.productType === 'digital' && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Digital File URL <span className="text-red-500">*</span></label>
                <input 
                  type="url" 
                  name="digitalFileUrl" 
                  required 
                  value={formData.digitalFileUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
                  placeholder="https://example.com/download/file.zip" 
                />
                <p className="text-xs text-gray-500">Provide the secure link where the buyer can download this digital product after purchase.</p>
              </div>
            )}
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

          {/* Tax Information */}
          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">GST/VAT Tax Rate (%)</label>
              <select 
                name="taxRate" 
                value={formData.taxRate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <div className="space-y-2 flex flex-col justify-center pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="taxInclusive" 
                  checked={formData.taxInclusive}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Selling Price includes Tax (Inclusive)</span>
              </label>
            </div>
          </div>

          {/* Subscription Settings */}
          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 flex flex-col justify-center pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="isSubscriptionEligible" 
                  checked={formData.isSubscriptionEligible}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Enable Subscribe & Save for this product</span>
              </label>
            </div>
            
            {formData.isSubscriptionEligible && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Subscription Discount (%)</label>
                <input 
                  type="number" 
                  name="subscriptionDiscount" 
                  required 
                  min="0"
                  max="100"
                  value={formData.subscriptionDiscount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
                  placeholder="e.g. 10"
                />
                <p className="text-xs text-gray-500">Discount applied to recurring subscription orders.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
          <h3 className="font-bold text-lg border-b pb-2">Product Image</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Product Image</label>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="w-40 h-40 rounded-xl border-2 border-dashed bg-gray-50 flex flex-col items-center justify-center overflow-hidden shrink-0 relative cursor-pointer hover:bg-gray-100 transition-colors">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                />
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <>
                    <UploadCloud className={`w-8 h-8 ${isUploadingImage ? 'text-primary animate-pulse' : 'text-gray-400'} mb-2`} />
                    <span className="text-xs text-gray-500 text-center px-4">
                      {isUploadingImage ? 'Uploading...' : 'Click or drag image to upload'}
                    </span>
                  </>
                )}
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                <p className="text-sm text-gray-600">
                  Upload a high-quality image of your product. This image will be displayed on the product listing page and search results.
                </p>
                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100">
                  <p className="font-bold mb-1">Requirements:</p>
                  <ul className="list-disc pl-4 space-y-1 text-blue-700/80">
                    <li>JPEG, PNG, or WebP format</li>
                    <li>Square aspect ratio recommended (e.g., 1000x1000)</li>
                    <li>Maximum file size: 5MB</li>
                  </ul>
                </div>
              </div>
            </div>
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
            disabled={isSubmitting || isUploadingImage}
            className="px-8 py-2.5 rounded-xl font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            <Save className="w-5 h-5" />
            {isSubmitting ? 'Saving...' : id ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
