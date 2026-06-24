import React from 'react';
import { Percent, Rocket } from 'lucide-react';

const Promotions: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-5 text-center animate-[fadeIn_150ms_ease]">
      <div className="w-20 h-20 rounded-full bg-[#F5FEFE] flex items-center justify-center">
        <Rocket size={36} className="text-[#01B4BA]" />
      </div>
      <div>
        <h2 className="font-artz font-bold text-2xl text-[#01406D]">Promotions</h2>
        <p className="font-inter text-sm text-[#6B8FA3] mt-1 max-w-sm">
          Create and manage platform-wide promotions, coupon campaigns, and discount events.
        </p>
      </div>
      <button className="bg-[#01B4BA] text-white px-6 py-3 rounded-[6px] text-sm font-inter font-bold min-h-[44px] hover:bg-[#019aa0] transition-colors duration-150">
        Create Promotion
      </button>
    </div>
  );
};

export default Promotions;
