import React from 'react';
import { HeadphonesIcon, MessageCircle, Mail, Phone } from 'lucide-react';

const Support: React.FC = () => {
  const channels = [
    { icon: MessageCircle, label: 'Live Chat', desc: 'Chat with our support team', color: 'text-[#01B4BA]', bg: 'bg-[#F5FEFE]' },
    { icon: Mail, label: 'Email Us', desc: 'support@shopyng.com', color: 'text-[#01406D]', bg: 'bg-[#01406D]/5' },
    { icon: Phone, label: 'Call Us', desc: '+91 1800-123-4567', color: 'text-[#FF7A0F]', bg: 'bg-[#FFF7ED]' },
  ];

  return (
    <div className="max-w-2xl mx-auto pt-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#F5FEFE] flex items-center justify-center mx-auto mb-4">
          <HeadphonesIcon size={32} className="text-[#01B4BA]" />
        </div>
        <h1 className="text-2xl font-artz font-bold text-[#01406D]">Vendor Support</h1>
        <p className="font-inter text-sm text-[#6B8FA3] mt-1">We're here to help you grow your business</p>
      </div>

      <div className="space-y-4">
        {channels.map((ch) => (
          <div key={ch.label} className="bg-white border border-[#E0EFEF] rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer">
            <div className={`w-12 h-12 ${ch.bg} rounded-xl flex items-center justify-center`}>
              <ch.icon size={22} className={ch.color} />
            </div>
            <div>
              <h3 className="font-artz font-bold text-sm text-[#01406D]">{ch.label}</h3>
              <p className="font-inter text-xs text-[#6B8FA3] mt-0.5">{ch.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-[#F5FEFE] border border-[#E0EFEF] rounded-2xl p-6 text-center">
        <h3 className="font-artz font-bold text-sm text-[#01406D] mb-2">FAQ</h3>
        <p className="font-inter text-xs text-[#6B8FA3]">
          Check our <span className="text-[#01B4BA] font-bold cursor-pointer hover:underline">Knowledge Base</span> for quick answers
        </p>
      </div>
    </div>
  );
};

export default Support;
