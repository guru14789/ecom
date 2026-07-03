import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Package, CheckCircle2, ChevronLeft, Navigation2 } from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-10">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
        <Link to="/orders" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <div>
          <h1 className="font-bold text-gray-900 leading-tight">Order #{orderId?.substring(0, 8) || '12345678'}</h1>
          <p className="text-xs text-gray-500 font-medium">Arriving in 8 mins</p>
        </div>
      </header>

      {/* Map Placeholder */}
      <div className="relative w-full h-64 bg-emerald-50 border-b overflow-hidden">
        <img 
          src="https://placehold.co/800x400/10b981/ffffff?text=Map+View" 
          alt="Map" 
          className="w-full h-full object-cover mix-blend-multiply opacity-50"
        />
        {/* Animated Delivery Pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center relative">
            <div className="absolute -inset-2 bg-primary/20 rounded-full animate-ping" />
            <Navigation2 className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 relative z-10 -mt-4">
        {/* Driver Card */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
              <img src="https://placehold.co/100x100?text=Ramesh" alt="Driver" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Ramesh Kumar</h3>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="text-yellow-500">★ 4.9</span>
                Delivery Partner
              </p>
            </div>
          </div>
          <a href="tel:+919876543210" className="w-10 h-10 bg-green-50 text-primary rounded-full flex items-center justify-center hover:bg-green-100 transition-colors">
            <Phone className="h-5 w-5 fill-current" />
          </a>
        </div>

        {/* Timeline */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border">
          <h3 className="font-bold text-gray-900 mb-4">Track Order</h3>
          
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:via-primary before:to-gray-200">
            
            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-primary text-white shrink-0 shadow z-10">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl bg-gray-50 border shadow-sm ml-4">
                <h4 className="font-bold text-sm text-gray-900">Order Placed</h4>
                <p className="text-xs text-gray-500 mt-1">We have received your order.</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-primary text-white shrink-0 shadow z-10">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl bg-gray-50 border shadow-sm ml-4">
                <h4 className="font-bold text-sm text-gray-900">Order Packed</h4>
                <p className="text-xs text-gray-500 mt-1">Your items are securely packed.</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-primary text-white shrink-0 shadow z-10 animate-pulse">
                <Package className="h-3 w-3" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl bg-green-50 border border-green-100 shadow-sm ml-4">
                <h4 className="font-bold text-sm text-primary">Out for Delivery</h4>
                <p className="text-xs text-gray-600 mt-1">Ramesh is on the way to your location.</p>
              </div>
            </div>

            <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
              <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white bg-gray-300 text-white shrink-0 shadow z-10">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-1.5rem)] p-4 rounded-xl bg-gray-50 border shadow-sm ml-4 opacity-60">
                <h4 className="font-bold text-sm text-gray-500">Delivered</h4>
                <p className="text-xs text-gray-400 mt-1">Waiting for arrival.</p>
              </div>
            </div>

          </div>
        </div>

        {/* Address */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-50 rounded-lg text-gray-500 mt-1">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Delivery Address</h3>
              <p className="text-xs text-gray-600 font-medium">Home</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">Flat 402, Sunshine Apartments, HSR Layout Sector 2, Bangalore, 560102</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
