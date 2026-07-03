import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { User, MapPin, Package, Heart, LogOut, ChevronRight, Edit2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, signOut, signInWithGoogle } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-sm border text-center">
        <div className="w-16 h-16 bg-green-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Welcome to shopsyy</h2>
        <p className="text-gray-500 mb-6">Login or sign up to view your profile, manage orders, and save addresses.</p>
        <button 
          onClick={signInWithGoogle}
          className="w-full bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary/90 transition-colors"
        >
          Login with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <h1 className="text-2xl font-black text-gray-900 mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar / User Info */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center relative">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-primary transition-colors"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 overflow-hidden border-2 border-white shadow-sm">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <User className="h-10 w-10" />
                </div>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{user.displayName || 'Add your name'}</h2>
            <p className="text-gray-500 text-sm">{user.email || user.phone}</p>
            <span className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 uppercase tracking-wider">
              {user.role}
            </span>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <Link to="/orders" className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-700">My Orders</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </Link>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-700">Saved Addresses</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-gray-500" />
                <span className="font-medium text-gray-700">Favorites</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <button 
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 p-4 bg-white border border-red-100 text-red-600 font-medium rounded-2xl hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Saved Addresses</h3>
            {user.addresses?.length > 0 ? (
              <div className="space-y-4">
                {user.addresses.map((address, index) => (
                  <div key={index} className="p-4 border rounded-xl flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                          {address.tag}
                        </span>
                        {index === 0 && <span className="text-xs text-primary font-medium">Default</span>}
                      </div>
                      <p className="text-gray-900 font-medium">{address.houseNo}, {address.area}</p>
                      <p className="text-gray-500 text-sm">{address.city}, {address.state} - {address.pincode}</p>
                    </div>
                    <button className="text-sm text-primary font-medium hover:underline">Edit</button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed rounded-xl">
                <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 mb-4">No addresses saved yet</p>
                <button className="text-primary font-medium hover:underline">
                  + Add New Address
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
