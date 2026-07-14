import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorApi } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import {
  Clock, CheckCircle, XCircle, AlertCircle, ShieldCheck,
  RefreshCw, ArrowRight, Mail, Phone, Loader2,
} from 'lucide-react';
import logo from '../../assets/logo.png';

interface RegistrationStatus {
  vendorId: string;
  registrationStatus: 'draft' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'suspended';
  onboardingStep: number;
  rejectionReason?: string;
  storeName?: string;
  storeSlug?: string;
}

const STATUS_CONFIG = {
  draft: {
    icon: AlertCircle,
    color: 'text-gray-500',
    bg: 'bg-gray-50 border-gray-200',
    iconBg: 'bg-gray-100',
    title: 'Registration Incomplete',
    message: 'You have not completed all registration steps. Please continue your application.',
    cta: 'Continue Registration',
    ctaPath: '/vendor/register',
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
    iconBg: 'bg-yellow-100',
    title: 'Under Review',
    message: 'Your registration has been submitted and is waiting for our team to begin the review process. This usually takes 1-2 business days.',
    cta: null,
    ctaPath: null,
  },
  under_review: {
    icon: ShieldCheck,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    title: 'Active Review in Progress',
    message: 'Our compliance team is reviewing your documents and business details. We will notify you via email and SMS once the review is complete.',
    cta: null,
    ctaPath: null,
  },
  approved: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-100',
    title: 'Approved! Welcome to shopsyy',
    message: 'Your seller account is now active. You can start listing products and accepting orders.',
    cta: 'Go to Seller Dashboard',
    ctaPath: '/vendor',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-100',
    title: 'Application Rejected',
    message: 'Unfortunately, your registration was not approved at this time.',
    cta: 'Re-apply',
    ctaPath: '/vendor/register',
  },
  suspended: {
    icon: XCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-200',
    iconBg: 'bg-orange-100',
    title: 'Account Suspended',
    message: 'Your seller account has been suspended. Please contact support for assistance.',
    cta: null,
    ctaPath: null,
  },
};

const TIMELINE_STEPS = [
  { key: 'submitted', label: 'Application Submitted', desc: 'Registration received by shopsyy' },
  { key: 'pending', label: 'Queued for Review', desc: 'Assigned to compliance team' },
  { key: 'under_review', label: 'Documents Verified', desc: 'KYC and business validation' },
  { key: 'approved', label: 'Account Activated', desc: 'You can start selling!' },
];

const getTimelineStep = (status: string): number => {
  if (status === 'draft') return 0;
  if (status === 'pending') return 1;
  if (status === 'under_review') return 2;
  if (status === 'approved') return 3;
  return 0;
};

export const VendorOnboardingStatus: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<RegistrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      const res: any = await vendorApi.register.status();
      setStatus(res.data);
    } catch (err) {
      // No vendor profile yet
      setStatus(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchStatus(); }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-500">Checking your registration status...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Registration Found</h2>
          <p className="text-gray-500 mb-6">You haven't started a vendor registration yet.</p>
          <button onClick={() => navigate('/vendor/register')}
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors">
            Start Registration
          </button>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[status.registrationStatus] || STATUS_CONFIG.draft;
  const Icon = config.icon;
  const currentTimelineStep = getTimelineStep(status.registrationStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50/20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src={logo} alt="shopyng" className="h-12 w-auto" />
            <span className="text-orange-500 text-sm font-black uppercase tracking-widest border-l-2 border-orange-200 pl-3 mt-1">Seller</span>
          </a>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Status Card */}
        <div className={`border rounded-2xl p-6 ${config.bg}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${config.iconBg} shrink-0`}>
              <Icon className={`h-8 w-8 ${config.color}`} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-gray-900">{config.title}</h2>
              {status.storeName && <p className="text-sm text-gray-500 mt-0.5">Store: <span className="font-medium">{status.storeName}</span></p>}
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">{config.message}</p>

              {/* Rejection reason */}
              {status.registrationStatus === 'rejected' && status.rejectionReason && (
                <div className="mt-3 p-3 bg-red-100 rounded-lg text-sm text-red-800">
                  <strong>Reason:</strong> {status.rejectionReason}
                </div>
              )}

              {config.cta && config.ctaPath && (
                <button onClick={() => navigate(config.ctaPath!)}
                  className="mt-4 flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm">
                  {config.cta} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {!['rejected', 'suspended'].includes(status.registrationStatus) && (
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-5">Application Progress</h3>
            <div className="space-y-0">
              {TIMELINE_STEPS.map((ts, i) => {
                const isDone = currentTimelineStep > i;
                const isCurrent = currentTimelineStep === i;
                return (
                  <div key={ts.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        isDone ? 'bg-green-500 border-green-500' :
                        isCurrent ? 'bg-primary border-primary animate-pulse' :
                        'bg-white border-gray-200'
                      }`}>
                        {isDone ? <CheckCircle className="h-4 w-4 text-white" /> :
                         isCurrent ? <div className="w-3 h-3 bg-white rounded-full" /> :
                         <div className="w-2 h-2 bg-gray-300 rounded-full" />}
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div className={`w-0.5 h-10 mt-1 transition-colors ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
                      )}
                    </div>
                    <div className="pb-8">
                      <p className={`font-bold text-sm ${isDone ? 'text-green-700' : isCurrent ? 'text-primary' : 'text-gray-400'}`}>
                        {ts.label} {isCurrent && <span className="ml-2 text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">In Progress</span>}
                        {isDone && <CheckCircle className="h-4 w-4 inline-block ml-1 text-green-500" />}
                      </p>
                      <p className={`text-xs mt-0.5 ${isDone || isCurrent ? 'text-gray-500' : 'text-gray-300'}`}>{ts.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Support */}
        <div className="bg-white rounded-2xl border p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a href="mailto:seller-support@shopsyy.com"
              className="flex items-center gap-3 p-3 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-sm">
              <div className="p-2 bg-blue-50 rounded-lg"><Mail className="h-4 w-4 text-blue-600" /></div>
              <div><p className="font-bold text-gray-800">Email Support</p><p className="text-gray-500 text-xs">seller-support@shopsyy.com</p></div>
            </a>
            <a href="tel:+918000000000"
              className="flex items-center gap-3 p-3 border rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-sm">
              <div className="p-2 bg-green-50 rounded-lg"><Phone className="h-4 w-4 text-green-600" /></div>
              <div><p className="font-bold text-gray-800">Phone Support</p><p className="text-gray-500 text-xs">Mon–Sat, 9am–6pm IST</p></div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
