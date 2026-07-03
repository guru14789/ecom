import React, { useEffect, useState } from 'react';
import logo from '@/assets/logo.png';

export const SplashScreen: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-white to-gray-50 z-[9999] flex flex-col items-center justify-center transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <img
        src={logo}
        alt="Shopyng"
        className="w-48 h-auto mb-4"
        style={{
          animation: mounted ? 'logoPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
          opacity: 0,
          transform: 'scale(0.6)',
        }}
      />

      <p
        className="mt-2 text-sm text-gray-500 font-medium"
        style={{
          animation: mounted ? 'fadeSlideUp 0.6s ease-out 0.3s forwards' : 'none',
          opacity: 0,
          transform: 'translateY(12px)',
        }}
      >
        Everything, delivered in 10 minutes.
      </p>

      <div
        className="absolute bottom-12 flex gap-2"
        style={{
          animation: mounted ? 'fadeIn 0.5s ease-out 0.6s forwards' : 'none',
          opacity: 0,
        }}
      >
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.8s' }} />
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.8s' }} />
        <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.8s' }} />
      </div>

      <style>{`
        @keyframes logoPop {
          0% { opacity: 0; transform: scale(0.6); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideUp {
          0% { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};
