import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash2, Star, Share2, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store';
import { removeFromWishlist } from '../store/slices/wishlistSlice';
import { addItem } from '../store/slices/cartSlice';
import { addToast, setLoginModalOpen, setPendingAction } from '../store/slices/uiSlice';
import { Product } from '../types';

export const Wishlist: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const user = useAppSelector((state) => state.auth.user);

  const handleAddToCart = (product: Product) => {
    if (!user?.isLoggedIn) {
      dispatch(setPendingAction({ type: 'cart', productId: product.id }));
      dispatch(setLoginModalOpen(true));
      return;
    }
    dispatch(addItem({ product, quantity: 1, isGroupBuy: false }));
    dispatch(addToast({ title: 'Added to Cart', message: `${product.name} added to your cart`, type: 'success' }));
  };

  const handleRemove = (productId: number) => {
    dispatch(removeFromWishlist(productId));
    dispatch(addToast({ title: 'Removed', message: 'Item removed from wishlist', type: 'info' }));
  };

  const handleShare = (product: Product) => {
    const url = `${window.location.origin}/?product=${product.id}`;
    navigator.clipboard.writeText(url).then(() => {
      dispatch(addToast({ title: 'Link Copied!', message: 'Share this product with friends', type: 'success' }));
    });
  };

  const discount = (mrp: number, price: number) =>
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-poppins font-extrabold text-2xl text-slate-800 flex items-center gap-2">
            <Heart size={24} className="text-rose-500 fill-rose-500" />
            My Wishlist
          </h1>
          <p className="font-inter text-sm text-slate-500 mt-0.5">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
      </div>

      {/* Empty state */}
      <AnimatePresence mode="wait">
        {wishlistItems.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-24 gap-6 text-center"
          >
            <div className="w-28 h-28 rounded-full bg-rose-50 flex items-center justify-center">
              <Heart size={52} className="text-rose-300" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-poppins font-bold text-xl text-slate-700">Your wishlist is empty</h2>
              <p className="font-inter text-sm text-slate-400 max-w-xs mx-auto">
                Save items you love by tapping the heart icon on any product. They'll appear here!
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-primary-main hover:bg-primary-hover text-white font-poppins font-bold px-8 py-3 rounded-2xl shadow-sm hover:shadow transition-all"
            >
              Explore Products
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          >
            <AnimatePresence>
              {wishlistItems.map((item, idx) => {
                const disc = discount(item.product.mrp || item.product.price * 1.2, item.product.price);
                return (
                  <motion.div
                    key={item.product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: idx * 0.04 } }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all group cursor-pointer flex flex-col"
                    onClick={() => navigate(`/?product=${item.product.id}`)}
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-slate-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={`/${item.product.image}`}
                        alt={item.product.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                      />
                      {disc > 0 && (
                        <span className="absolute top-3 left-3 bg-rose-500 text-white text-[10px] font-poppins font-extrabold px-2 py-0.5 rounded-full">
                          -{disc}%
                        </span>
                      )}
                      {item.product.badge && (
                        <span className="absolute top-3 right-3 bg-amber-400 text-white text-[10px] font-poppins font-extrabold px-2 py-0.5 rounded-full capitalize">
                          {item.product.badge}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col gap-2 flex-grow">
                      <h3 className="font-poppins font-bold text-sm text-slate-800 line-clamp-2 leading-tight">
                        {item.product.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-0.5 bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          <Star size={9} className="fill-white" />
                          {item.product.rating}
                        </div>
                        <span className="text-[10px] text-slate-400 font-inter">({item.product.reviews})</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="font-poppins font-extrabold text-base text-slate-800">
                          ₹{item.product.price.toLocaleString('en-IN')}
                        </span>
                        {item.product.groupPrice < item.product.price && (
                          <span className="text-[10px] font-inter text-primary-main font-bold bg-primary-main/10 px-1.5 py-0.5 rounded-md">
                            Group ₹{item.product.groupPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleAddToCart(item.product)}
                          className="flex-1 bg-primary-main hover:bg-primary-hover text-white font-poppins font-bold text-xs py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag size={12} />
                          Add
                        </button>
                        <button
                          onClick={() => handleShare(item.product)}
                          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
                          title="Share"
                        >
                          <Share2 size={13} />
                        </button>
                        <button
                          onClick={() => handleRemove(item.product.id)}
                          className="p-2.5 rounded-xl border border-rose-100 hover:bg-rose-50 text-rose-400 hover:text-rose-500 transition-colors"
                          title="Remove from wishlist"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Added date */}
                    <div className="px-4 pb-3 pt-0">
                      <span className="text-[10px] font-inter text-slate-300">
                        Added {new Date(item.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
