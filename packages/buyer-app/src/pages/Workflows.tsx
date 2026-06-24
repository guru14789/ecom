import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  ArrowRight,
  Settings,
  Rocket,
  Home,
  Search,
  Tag,
  Package,
  Handshake,
  PlusCircle,
  Share2,
  Unlock,
  CreditCard,
  PartyPopper,
  Sparkles,
  Lock,
  Globe,
  ShoppingBag,
  BarChart2,
  Timer,
  Link,
  Zap,
  FileText,
  TrendingUp,
  Terminal,
  Coins,
  Gem,
  Building2
} from 'lucide-react';

type TabType = 'customer' | 'app' | 'vendor';

interface Step {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  name: string;
  desc: string;
}

export const Workflows: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('customer');

  const customerFlowSection1: Step[] = [
    { icon: Rocket, name: 'Open App', desc: 'Seamless entry into the ShopYNG ecosystem.' },
    { icon: Home, name: 'Home Feed', desc: 'Personalized deals and dynamic category exploration.' },
    { icon: Search, name: 'Discovery', desc: 'Search products or browse verified group deals.' },
    { icon: Tag, name: 'Listing Page', desc: 'Advanced filtering and smart sorting logic.' },
  ];

  const customerFlowSection2: Step[] = [
    { icon: Package, name: 'Product Detail', desc: 'Real-time pricing data and group availability check.' },
    { icon: Handshake, name: 'Join Group', desc: 'Instantly join an existing buying circle.' },
    { icon: PlusCircle, name: 'Create Group', desc: 'Initiate a new group to unlock the lowest price.' },
  ];

  const customerFlowSection3: Step[] = [
    { icon: Share2, name: 'Viral Sharing', desc: 'Invite friends to fill the remaining slots.' },
    { icon: Unlock, name: 'Price Unlocked', desc: 'Group completed. Individual savings maximized.' },
    { icon: CreditCard, name: 'Secure Checkout', desc: 'Escrow-backed payment and address verification.' },
    { icon: PartyPopper, name: 'Order Success', desc: 'Real-time tracking and delivery confirmation.' },
  ];

  const appFlowSection: Step[] = [
    { icon: Sparkles, name: 'Splash & Onboard', desc: 'Brand introduction and value education.' },
    { icon: Lock, name: 'Auth Gateway', desc: 'Secure OTP or social login integration.' },
    { icon: Globe, name: 'Geo-Location', desc: 'Defining local availability and delivery zones.' },
    { icon: ShoppingBag, name: 'Marketplace', desc: 'Central hub for social buying interactions.' },
  ];

  const appMicroServiceFlow: Step[] = [
    { icon: BarChart2, name: 'State Monitor', desc: 'Tracking member count & remaining slots.' },
    { icon: Timer, name: 'Countdown Ticker', desc: '24-hour urgency mechanism for group completion.' },
    { icon: Link, name: 'Referral Engine', desc: 'Deep-linking for one-click group entry.' },
    { icon: Zap, name: 'Auto-Checkout', desc: 'Instant cart conversion upon group success.' },
  ];

  const vendorFlowSection: Step[] = [
    { icon: FileText, name: 'Onboarding', desc: 'Registration, Category selection, and Branding.' },
    { icon: Shield, name: 'KYC Compliance', desc: 'Automated document verification and shop approval.' },
    { icon: TrendingUp, name: 'Storefront', desc: 'Product listing, pricing strategies, and SEO setup.' },
    { icon: Terminal, name: 'Order Panel', desc: 'Centralized dashboard for real-time order tracking.' },
    { icon: Package, name: 'Logistics Hub', desc: 'Packaging, pickup coordination, and shipping.' },
    { icon: Coins, name: 'Payout Ledger', desc: 'Transparent transaction history and fund withdrawal.' },
  ];

  return (
    <div className="min-h-screen bg-bg-light pt-32 pb-16 px-6">
      {/* Header section */}
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        <div className="text-center flex flex-col gap-4 max-w-2xl mx-auto">
          <h1 className="font-poppins font-black text-slate-800 text-4xl md:text-5xl leading-tight tracking-tight">
            Platform Workflows
          </h1>
          <p className="font-inter text-sm text-slate-500 font-semibold leading-relaxed">
            Visualizing the high-performance logic behind our social commerce engine. From seamless onboarding to unlocked group savings.
          </p>
        </div>

        {/* Dynamic Tab Switchers */}
        <div className="flex justify-center gap-4">
          {([
            { key: 'customer', label: 'Customer Journey', icon: User },
            { key: 'app', label: 'App Architecture', icon: Settings },
            { key: 'vendor', label: 'Vendor Operations', icon: Shield },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-poppins font-bold text-xs border transition-all duration-300 shadow-sm ${
                  activeTab === tab.key
                    ? 'bg-primary-main border-primary-main text-white shadow-premium'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:y-[-1px]'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Interactive Visualizer Canvas */}
        <div className="bg-white border border-primary-main/15 p-8 md:p-12 rounded-[40px] shadow-[0_20px_50px_rgba(1,64,109,0.05)] relative overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'customer' && (
              <motion.div
                key="customer"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-10"
              >
                {/* Customer Section 1 */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary-main text-white font-poppins font-extrabold flex items-center justify-center text-sm shadow-sm font-poppins">
                      01
                    </span>
                    <h3 className="font-poppins font-bold text-slate-800 text-lg">Entry & Discovery Flow</h3>
                  </div>
                  <div className="flex items-center gap-6 overflow-x-auto pb-4 horizontal-scroll-hide relative">
                    {customerFlowSection1.map((step, idx) => {
                      const Icon = step.icon;
                      return (
                        <React.Fragment key={step.name}>
                          <motion.div
                            whileHover={{ y: -4 }}
                            className="min-w-[200px] max-w-[200px] bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm hover:border-primary-main/30 hover:shadow-md transition-all flex flex-col items-center gap-3.5"
                          >
                            <span className="text-primary-main filter drop-shadow-sm select-none">
                              <Icon size={36} />
                            </span>
                            <h4 className="font-poppins font-bold text-slate-800 text-sm leading-tight">{step.name}</h4>
                            <p className="font-inter text-[11px] text-slate-400 font-semibold leading-relaxed">{step.desc}</p>
                          </motion.div>
                          {idx === 0 && (
                            <div className="flex flex-col items-center justify-center min-w-[100px] gap-1.5 text-[10px] font-poppins font-bold text-accent-orange bg-accent-orange/5 border border-accent-orange/15 px-3 py-4 rounded-2xl">
                              <Gem size={14} className="text-accent-orange" />
                              <span>Auth Check</span>
                            </div>
                          )}
                          {idx < customerFlowSection1.length - 1 && idx !== 0 && (
                            <ArrowRight size={18} className="text-slate-300 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Section 2 */}
                <div className="flex flex-col gap-6 border-t border-slate-100 pt-8">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary-main text-white font-poppins font-extrabold flex items-center justify-center text-sm shadow-sm font-poppins">
                      02
                    </span>
                    <h3 className="font-poppins font-bold text-slate-800 text-lg">Product & Group Logic</h3>
                  </div>
                  <div className="flex items-center gap-6 overflow-x-auto pb-4 horizontal-scroll-hide relative">
                    {customerFlowSection2.map((step, idx) => {
                      const Icon = step.icon;
                      return (
                        <React.Fragment key={step.name}>
                          <motion.div
                            whileHover={{ y: -4 }}
                            className="min-w-[200px] max-w-[200px] bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm hover:border-primary-main/30 hover:shadow-md transition-all flex flex-col items-center gap-3.5"
                          >
                            <span className="text-primary-main filter drop-shadow-sm select-none">
                              <Icon size={36} />
                            </span>
                            <h4 className="font-poppins font-bold text-slate-800 text-sm leading-tight">{step.name}</h4>
                            <p className="font-inter text-[11px] text-slate-400 font-semibold leading-relaxed">{step.desc}</p>
                          </motion.div>
                          {idx === 0 && (
                            <div className="flex flex-col items-center justify-center min-w-[100px] gap-1.5 text-[10px] font-poppins font-bold text-accent-orange bg-accent-orange/5 border border-accent-orange/15 px-3 py-4 rounded-2xl">
                              <Gem size={14} className="text-accent-orange" />
                              <span>Has Group?</span>
                            </div>
                          )}
                          {idx < customerFlowSection2.length - 1 && idx !== 0 && (
                            <ArrowRight size={18} className="text-slate-300 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Section 3 */}
                <div className="flex flex-col gap-6 border-t border-slate-100 pt-8">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary-main text-white font-poppins font-extrabold flex items-center justify-center text-sm shadow-sm font-poppins">
                      03
                    </span>
                    <h3 className="font-poppins font-bold text-slate-800 text-lg">Fulfillment & Success</h3>
                  </div>
                  <div className="flex items-center gap-6 overflow-x-auto pb-4 horizontal-scroll-hide relative">
                    {customerFlowSection3.map((step, idx) => {
                      const Icon = step.icon;
                      return (
                        <React.Fragment key={step.name}>
                          <motion.div
                            whileHover={{ y: -4 }}
                            className="min-w-[200px] max-w-[200px] bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm hover:border-primary-main/30 hover:shadow-md transition-all flex flex-col items-center gap-3.5"
                          >
                            <span className="text-primary-main filter drop-shadow-sm select-none">
                              <Icon size={36} />
                            </span>
                            <h4 className="font-poppins font-bold text-slate-800 text-sm leading-tight">{step.name}</h4>
                            <p className="font-inter text-[11px] text-slate-400 font-semibold leading-relaxed">{step.desc}</p>
                          </motion.div>
                          {idx < customerFlowSection3.length - 1 && (
                            <ArrowRight size={18} className="text-slate-300 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Diagram Legend */}
                <div className="flex justify-center gap-8 bg-slate-50 border border-slate-200/50 p-5 rounded-2xl text-xs font-poppins font-bold text-slate-600 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-primary-main" />
                    <span>Core Action Step</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-accent-orange" />
                    <span>Decision Gateway</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded bg-slate-300" />
                    <span>Connection Hook</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'app' && (
              <motion.div
                key="app"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-10"
              >
                {/* Core App flows */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary-main text-white font-poppins font-extrabold flex items-center justify-center text-sm shadow-sm font-poppins">
                      <Settings size={16} />
                    </span>
                    <h3 className="font-poppins font-bold text-slate-800 text-lg">Core Application Flow</h3>
                  </div>
                  <div className="flex items-center gap-6 overflow-x-auto pb-4 horizontal-scroll-hide relative">
                    {appFlowSection.map((step, idx) => {
                      const Icon = step.icon;
                      return (
                        <React.Fragment key={step.name}>
                          <motion.div
                            whileHover={{ y: -4 }}
                            className="min-w-[200px] max-w-[200px] bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm hover:border-primary-main/30 hover:shadow-md transition-all flex flex-col items-center gap-3.5"
                          >
                            <span className="text-primary-main filter drop-shadow-sm select-none">
                              <Icon size={36} />
                            </span>
                            <h4 className="font-poppins font-bold text-slate-800 text-sm leading-tight">{step.name}</h4>
                            <p className="font-inter text-[11px] text-slate-400 font-semibold leading-relaxed">{step.desc}</p>
                          </motion.div>
                          {idx < appFlowSection.length - 1 && (
                            <ArrowRight size={18} className="text-slate-300 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Sub-flow micro-service details */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[32px] mt-2 flex flex-col gap-6">
                  <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
                    <h4 className="font-poppins font-black text-[#01B4BA] text-sm tracking-wider uppercase">
                      The Group Buying Micro-service
                    </h4>
                  </div>
                  <div className="flex items-center gap-6 overflow-x-auto pb-2 horizontal-scroll-hide relative">
                    {appMicroServiceFlow.map((step, idx) => {
                      const Icon = step.icon;
                      return (
                        <React.Fragment key={step.name}>
                          <motion.div
                            whileHover={{ y: -4 }}
                            className="min-w-[190px] max-w-[190px] bg-white border border-slate-200/80 rounded-2xl p-5 text-center shadow-sm hover:border-primary-main/20 transition-all flex flex-col items-center gap-2.5"
                          >
                            <span className="text-primary-main filter select-none">
                              <Icon size={28} />
                            </span>
                            <h5 className="font-poppins font-bold text-slate-800 text-xs leading-tight">{step.name}</h5>
                            <p className="font-inter text-[10px] text-slate-400 font-semibold leading-relaxed">{step.desc}</p>
                          </motion.div>
                          {idx < appMicroServiceFlow.length - 1 && (
                            <ArrowRight size={16} className="text-slate-300 flex-shrink-0" />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'vendor' && (
              <motion.div
                key="vendor"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary-main text-white font-poppins font-extrabold flex items-center justify-center text-sm shadow-sm font-poppins">
                    <Building2 size={16} />
                  </span>
                  <h3 className="font-poppins font-bold text-slate-800 text-lg">Vendor Lifecycle Operations</h3>
                </div>
                <div className="flex items-center gap-6 overflow-x-auto pb-4 horizontal-scroll-hide relative">
                  {vendorFlowSection.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                      <React.Fragment key={step.name}>
                        <motion.div
                          whileHover={{ y: -4 }}
                          className="min-w-[190px] max-w-[190px] bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm hover:border-primary-main/30 hover:shadow-md transition-all flex flex-col items-center gap-3.5"
                        >
                          <span className="text-primary-main filter drop-shadow-sm select-none">
                            <Icon size={36} />
                          </span>
                          <h4 className="font-poppins font-bold text-slate-800 text-sm leading-tight">{step.name}</h4>
                          <p className="font-inter text-[11px] text-slate-400 font-semibold leading-relaxed">{step.desc}</p>
                        </motion.div>
                        {idx < vendorFlowSection.length - 1 && (
                          <ArrowRight size={18} className="text-slate-300 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
