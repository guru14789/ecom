import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, ArrowUpRight, Code, Megaphone, Package, Smile, RefreshCw, X, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DEPARTMENT_ICONS: Record<string, any> = {
  engineering: Code,
  tech: Code,
  marketing: Megaphone,
  sales: Megaphone,
  operations: Package,
  delivery: Package,
  support: Smile,
  hr: Smile,
};

export const CareersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    resumeUrl: '',
    coverLetter: '',
  });

  const { data: response, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-jobs'],
    queryFn: async () => {
      return await publicApi.jobs.list();
    },
    staleTime: 60_000,
  });

  const jobs = response?.data || [];

  const handleApplyClick = (job: any) => {
    if (!user) {
      toast.error('Please sign in to apply for job openings');
      navigate('/profile');
      return;
    }
    setSelectedJob(job);
    setForm({
      fullName: user.displayName || '',
      email: user.email || '',
      phone: user.phone || '',
      resumeUrl: '',
      coverLetter: '',
    });
    setShowApplyModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone) {
      toast.error('Name, Email, and Phone number are required.');
      return;
    }
    setSubmitting(true);
    try {
      // Simulate submission/API call (could route to application db if required)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success(`Application for "${selectedJob.role}" submitted successfully!`);
      setShowApplyModal(false);
    } catch {
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white selection:bg-orange-100 pb-20">
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto border-b border-gray-50">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-8">
            Build the future <br className="hidden md:block"/> of local commerce.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl leading-relaxed">
            We are looking for passionate builders, thinkers, and operators to join us in our mission to simplify how neighborhoods shop.
          </p>
        </div>
        <div className="w-24 h-1 bg-green-500 rounded-full"></div>
      </section>

      {/* Culture Section */}
      <section className="py-24 px-4 md:px-8 max-w-5xl mx-auto">
        <h2 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-16">Why shopyng?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Autonomy & Impact</h3>
            <p className="text-gray-500 font-light leading-relaxed">
              We don't do micromanagement. We hire smart people, give them hard problems to solve, and get out of their way. Every line of code, every marketing campaign, and every operational tweak directly impacts thousands of local businesses.
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Radical Candor</h3>
            <p className="text-gray-500 font-light leading-relaxed">
              We believe in open, honest, and direct communication. No politics, no hidden agendas. Just a group of people working together to build the best possible product. Feedback is a gift, and we share it freely.
            </p>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24 px-4 md:px-8 bg-gray-50/30 border-t border-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <h2 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-4">Open Roles</h2>
              <h3 className="text-4xl font-black text-gray-900">Join the team.</h3>
            </div>
            <p className="text-gray-400 font-light mt-4 md:mt-0">
              Don't see your role?{' '}
              <a href="mailto:jobs@shopyng.com" className="text-primary underline hover:text-orange-600 transition-colors">
                Email us
              </a>
              .
            </p>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
              Loading career opportunities...
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-red-500 bg-white border rounded-3xl p-6">
              Failed to load positions. Please check back later or try refreshing.
              <button onClick={() => refetch()} className="block mx-auto mt-4 font-bold text-sm text-orange-500 underline">
                Refresh Listings
              </button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center bg-white border border-gray-100 rounded-3xl p-8">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="font-bold text-gray-900 mb-1">No Open Positions</h4>
              <p className="text-sm text-gray-500">We don't have any openings at the moment. Please send us your CV at jobs@shopyng.com.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((pos: any) => {
                const Icon = DEPARTMENT_ICONS[pos.dept.toLowerCase()] || Briefcase;
                return (
                  <div
                    key={pos.id}
                    onClick={() => handleApplyClick(pos)}
                    className="group flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 bg-white border border-gray-100 rounded-3xl hover:border-orange-200 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-6 mb-4 md:mb-0">
                      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-orange-50 transition-colors duration-300 shrink-0">
                        <Icon className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors duration-300" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900 mb-1">{pos.role}</h4>
                        <div className="flex items-center gap-4 text-sm font-light text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4" /> {pos.dept}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" /> {pos.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button className="flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-primary transition-colors duration-300 self-start md:self-auto ml-20 md:ml-0">
                      Apply Now <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Application Form Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-6 border">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-xl font-black text-blue-950">Job Application</h2>
                <p className="text-xs text-gray-500 mt-1">Applying for <span className="font-bold text-orange-500">{selectedJob.role}</span> ({selectedJob.location})</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Resume / CV Link</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/d/..."
                  value={form.resumeUrl}
                  onChange={(e) => setForm(p => ({ ...p, resumeUrl: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cover Letter / Note</label>
                <textarea
                  rows={3}
                  placeholder="Tell us why you are a great fit..."
                  value={form.coverLetter}
                  onChange={(e) => setForm(p => ({ ...p, coverLetter: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 text-sm"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
