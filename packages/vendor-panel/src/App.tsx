import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import GroupBuy from './pages/GroupBuy';
import BulkStock from './pages/BulkStock';
import Inventory from './pages/Inventory';
import Promotions from './pages/Promotions';
import Orders from './pages/Orders';
import Fulfillment from './pages/Fulfillment';
import Earnings from './pages/Earnings';
import Payouts from './pages/Payouts';
import Shipments from './pages/Shipments';
import Subscription from './pages/Subscription';
import Settings from './pages/Settings';
import Coupons from './pages/Coupons';
import VendorReturns from './pages/VendorReturns';
import VendorAnalytics from './pages/VendorAnalytics';
import Support from './pages/Support';
import Login from './pages/Login';
import { useAppDispatch } from './store';
import api from './api/client';

const AuthenticatedApp: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    api.get('/vendor/dashboard')
      .then((res) => {
        const d = res.data.data;
        if (d.stats) dispatch({ type: 'SET_STATS', payload: d.stats });
        if (d.subscription) dispatch({ type: 'SET_SUBSCRIPTION', payload: d.subscription });
      })
      .catch(() => {});
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-[#F5FEFE] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/bulk-stock" element={<BulkStock />} />
            <Route path="/group-buy" element={<GroupBuy />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/fulfillment" element={<Fulfillment />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/payouts" element={<Payouts />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/returns" element={<VendorReturns />} />
            <Route path="/analytics" element={<VendorAnalytics />} />
            <Route path="/support" element={<Support />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  useLocation();
  const token = localStorage.getItem('vendor_token');

  if (!token) {
    return (
      <Routes>
        <Route path="/*" element={<Login />} />
      </Routes>
    );
  }

  return <AuthenticatedApp />;
};

export default App;
