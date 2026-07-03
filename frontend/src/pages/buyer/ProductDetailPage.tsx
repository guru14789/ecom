import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../store/useCart';
import { Minus, Plus, ChevronLeft, Star } from 'lucide-react';
import type { Product } from '../../types';
import { toast } from 'react-hot-toast';

// Mock product data for now
const MOCK_PRODUCT: Product = {
  id: 'p1',
  vendorId: 'v1',
  name: 'Farm Fresh Organic Bananas',
  slug: 'farm-fresh-organic-bananas',
  description: 'Naturally ripened, sweet and delicious organic bananas sourced directly from local farms. Perfect for breakfast or a healthy snack.',
  images: ['https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=800&q=80'],
  category: 'Fresh Fruits',
  tags: ['organic', 'fresh', 'fruit'],
  price: 65,
  mrp: 80,
  discountPercent: 18,
  unit: '1 kg',
  stock: 50,
  isAvailable: true,
  isFeatured: true,
  rating: 4.8,
  reviewCount: 124,
  brand: 'Apple',
  specifications: {
    'Screen Size': '6.1 inches',
    'Processor': 'A15 Bionic',
    'Camera': '12MP + 12MP',
    'OS': 'iOS 15'
  },
  variants: [
    { id: 'v1', name: '128GB, Midnight', price: 69900, mrp: 79900, stock: 10, attributes: { Storage: '128GB', Color: 'Midnight' } },
    { id: 'v2', name: '256GB, Starlight', price: 79900, mrp: 89900, stock: 5, attributes: { Storage: '256GB', Color: 'Starlight' } }
  ]
};

export const ProductDetailPage: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { items, addItem, updateQuantity } = useCart();
  
  const product = MOCK_PRODUCT; // In real app, fetch by productId
  const [selectedVariantId, setSelectedVariantId] = React.useState(product.variants?.[0]?.id);
  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
  
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentMrp = selectedVariant ? selectedVariant.mrp : product.mrp;
  
  const cartItem = items.find(item => item.product.id === product.id && item.selectedVariant?.id === selectedVariant?.id);
  const quantityInCart = cartItem?.quantity || 0;

  const handleAddItem = () => {
    try {
      addItem(product, 1, selectedVariant);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Breadcrumb / Back Navigation */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Product Image Gallery */}
        <div className="bg-white border rounded-2xl p-8 flex items-center justify-center aspect-square sticky top-24">
          <img 
            src={product.images[0]} 
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply hover:scale-105 transition-transform duration-500"
          />
          {product.discountPercent > 0 && (
            <div className="absolute top-4 left-4 bg-accent text-accent-foreground text-sm font-bold px-3 py-1 rounded shadow-sm">
              {product.discountPercent}% OFF
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div>
            <div className="text-sm text-gray-500 mb-2">{product.category}</div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mb-3">
              {product.brand && <span className="block text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">{product.brand}</span>}
              {product.name}
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded">
                {product.unit}
              </span>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                <span className="font-bold text-gray-900">{product.rating}</span>
                <span className="text-gray-400 hover:text-secondary underline cursor-pointer transition-colors">({product.reviewCount} reviews)</span>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* Pricing & Add to Cart */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {product.discountPercent > 0 && (
                <span className="text-sm text-gray-400 line-through">MRP ₹{currentMrp}</span>
              )}
              <span className="text-3xl font-black text-gray-900">₹{currentPrice}</span>
              <span className="text-xs text-gray-500 mt-1">Inclusive of all taxes</span>
            </div>

            <div className="w-32 h-12">
              {quantityInCart === 0 ? (
                <button 
                  onClick={handleAddItem}
                  className="w-full h-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold shadow-sm transition-all active:scale-95"
                >
                  ADD
                </button>
              ) : (
                <div className="flex items-center bg-primary text-primary-foreground rounded-xl h-full shadow-sm overflow-hidden">
                  <button 
                    onClick={() => updateQuantity(product.id, quantityInCart - 1, selectedVariant?.id)}
                    className="flex-1 flex items-center justify-center h-full hover:bg-primary/90 transition-colors"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="text-base font-bold w-10 text-center">{quantityInCart}</span>
                  <button 
                    onClick={handleAddItem}
                    className="flex-1 flex items-center justify-center h-full hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Highlights & Delivery */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex gap-3 text-sm text-gray-900">
            <span className="text-xl grayscale">⚡</span>
            <div>
              <span className="font-bold block">Superfast Delivery</span>
              <span className="text-gray-500">Get this item delivered in 10 minutes from the nearest store.</span>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Select Variant</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    className={`px-4 py-2 border rounded-xl text-sm font-medium transition-all ${
                      selectedVariantId === variant.id 
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm' 
                        : 'border-gray-200 text-gray-700 hover:border-primary'
                    }`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && (
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Specifications</h3>
              <div className="border rounded-xl divide-y text-sm">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 p-3">
                    <div className="font-medium text-gray-600">{key}</div>
                    <div className="col-span-2 text-gray-900">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="w-full h-px bg-gray-100" />

          {/* Description */}
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              {product.description}
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};
