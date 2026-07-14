import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Rocket, Check, ArrowRight, TrendingUp, HelpCircle } from 'lucide-react';

export const AcceleratorPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#0A192F] text-white py-20 px-6 sm:px-12 lg:px-24">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Introducing Shopyng Accelerator
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-orange-400 bg-clip-text text-transparent">
            Scale Your Brand globally with Shopyng's Power
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            The Shopyng Accelerator program partners with high-potential brands and manufacturers to supercharge their sales, optimize logistics, and expand global market presence.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              to="/vendor/register"
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.03] active:scale-[0.97] transition-all"
            >
              Apply to Accelerator <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#benefits"
              className="px-8 py-4 border border-slate-700 hover:border-slate-500 rounded-xl font-bold transition-all text-slate-200"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>

      {/* Stats / Impact Section */}
      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-3xl border shadow-xl shadow-slate-900/5">
          <div className="flex items-center gap-4 p-4 border-r border-slate-100 last:border-0">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">10x Speed</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Average growth velocity</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 border-r border-slate-100 last:border-0">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">₹25 Cr+</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Total funding deployed</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 last:border-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900">Exclusive</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Brand Protection & Badging</p>
            </div>
          </div>
        </div>
      </div>

      {/* Program Benefits */}
      <div id="benefits" className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">How the Accelerator Works</h2>
          <p className="text-slate-500 text-sm">We don't just list your products. We invest, optimize, and build equity in your brand.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Growth Capital',
              desc: 'Get equity-free funding for inventory expansion, product development, and manufacturing capacity.',
            },
            {
              title: 'Marketing Boost',
              desc: 'Dedicated advertising budgets, front-page placements, and prioritized visibility in buyer search feeds.',
            },
            {
              title: 'Superior Logistics',
              desc: 'Access to Fulfilment by Shopyng (FBS) warehouses with prime status badging and instant shipping guarantees.',
            },
            {
              title: 'Brand Protection',
              desc: 'Global intellectual property safeguarding, automated counterfeit detection, and unified seller accounts.',
            },
          ].map((benefit, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-black">
                {i + 1}
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">{benefit.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Eligibility Requirements */}
      <div className="bg-[#0A192F] text-white py-20 px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black tracking-tight">Who Can Apply?</h2>
            <p className="text-slate-400 text-sm">We partner with manufacturers and brands who meet the following criteria:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Direct-to-Consumer (DTC) brands with registered trademarks',
              'Consistent monthly revenue history (minimum ₹5 Lakhs)',
              'Scalable manufacturing capacity or reliable sourcing models',
              'Strong customer delight scores and low return ratios',
            ].map((req, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold text-slate-200 leading-relaxed">{req}</span>
              </div>
            ))}
          </div>

          <div className="text-center pt-6">
            <Link
              to="/vendor/register"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              Apply to the Program <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-2">
            <HelpCircle className="w-8 h-8 text-orange-500" /> FAQ
          </h2>
          <p className="text-slate-500 text-sm">Got questions? We have answers.</p>
        </div>

        <div className="space-y-4 divide-y divide-slate-150">
          {[
            {
              q: 'Is there an application fee?',
              a: 'No. Applying to the Shopyng Accelerator program is completely free.',
            },
            {
              q: 'How long does the selection process take?',
              a: 'Our selection committee reviews applications within 7 to 10 business days.',
            },
            {
              q: 'Do you take equity in my brand?',
              a: 'We offer both equity-based and revenue-share options customized to your business goals.',
            },
          ].map((faq, i) => (
            <div key={i} className="pt-4 first:pt-0 space-y-2">
              <h4 className="font-extrabold text-slate-900 text-sm">{faq.q}</h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
