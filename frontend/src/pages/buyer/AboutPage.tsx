import React from 'react';
import { Leaf, Zap, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white selection:bg-orange-100">
      
      {/* Minimalist Hero */}
      <section className="pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
        <div className="mb-16">
          <img src={logo} alt="shopyng" className="h-10 w-auto mb-10 opacity-80 grayscale hover:grayscale-0 transition-all duration-700" />
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-tight mb-8">
            Simplicity in <br className="hidden md:block"/> every delivery.
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl leading-relaxed">
            shopyng is a minimalist approach to local grocery delivery. We strip away the noise, connecting you directly to fresh, community-sourced essentials.
          </p>
        </div>
        
        <div className="w-24 h-1 bg-orange-500 rounded-full"></div>
      </section>

      {/* The Story - Airy Layout */}
      <section className="py-24 px-4 md:px-8 bg-gray-50/50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div>
            <h2 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-4">Our Origin</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-6">
              Born from a desire for better.
            </h3>
            <p className="text-gray-500 leading-relaxed mb-6 font-light">
              The modern supply chain is overly complex. We set out to build a platform that focuses purely on what matters: the quality of the product and the speed of delivery.
            </p>
            <p className="text-gray-500 leading-relaxed font-light">
              By empowering local vendors with modern tools, we've created a quiet revolution in how neighborhoods shop. No overwhelming choices. Just the best of your local market, delivered instantly.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] bg-gray-100 rounded-3xl overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&q=80&w=800" 
                alt="Fresh produce" 
                className="absolute inset-0 w-full h-full object-cover mix-blend-multiply opacity-90 transition-transform duration-1000 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles - Clean List */}
      <section className="py-32 px-4 md:px-8 max-w-5xl mx-auto">
        <h2 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-20 text-center">Core Principles</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-8 group-hover:bg-green-50 transition-colors duration-500">
              <Leaf className="w-6 h-6 text-gray-400 group-hover:text-green-500 transition-colors duration-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pure Quality</h3>
            <p className="text-gray-500 leading-relaxed text-sm font-light">
              We curate only the freshest items from trusted local sources, ensuring zero compromise on quality.
            </p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-8 group-hover:bg-orange-50 transition-colors duration-500">
              <Zap className="w-6 h-6 text-gray-400 group-hover:text-orange-500 transition-colors duration-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Frictionless</h3>
            <p className="text-gray-500 leading-relaxed text-sm font-light">
              Our minimalist platform is designed to get you from browsing to checkout in seconds.
            </p>
          </div>

          <div className="flex flex-col items-center text-center group">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-8 group-hover:bg-blue-50 transition-colors duration-500">
              <Heart className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Local First</h3>
            <p className="text-gray-500 leading-relaxed text-sm font-light">
              Every purchase strengthens your immediate community, supporting the people who grow and craft your food.
            </p>
          </div>
        </div>
      </section>

      {/* Minimal Footer CTA */}
      <section className="py-24 px-4 text-center border-t border-gray-100">
        <h2 className="text-2xl font-light text-gray-900 mb-8">Ready to experience better?</h2>
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all duration-300">
          Start shopping <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
      
    </div>
  );
};
