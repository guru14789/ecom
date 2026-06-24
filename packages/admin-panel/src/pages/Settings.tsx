import React from 'react';
import { Settings as SettingsIcon, Shield, Bell, Globe, Lock } from 'lucide-react';

const sections = [
  { icon: Shield, label: 'General', desc: 'Platform name, logo, contact info' },
  { icon: Bell, label: 'Notifications', desc: 'Email, SMS, and push notification config' },
  { icon: Globe, label: 'Localization', desc: 'Currency, timezone, language settings' },
  { icon: Lock, label: 'Security', desc: 'Admin passwords, 2FA, session timeout' },
];

const Settings: React.FC = () => {
  return (
    <div className="animate-[fadeIn_150ms_ease] max-w-2xl">
      <h1 className="text-2xl font-artz font-bold text-[#01406D] mb-6">Settings</h1>
      <div className="space-y-3">
        {sections.map((s) => (
          <div key={s.label} className="bg-white border border-[#E0EFEF] rounded-2xl p-5 flex items-center gap-4 hover:shadow-sm transition-shadow duration-150 cursor-pointer">
            <div className="w-12 h-12 bg-[#F5FEFE] rounded-[6px] flex items-center justify-center">
              <s.icon size={22} className="text-[#01B4BA]" />
            </div>
            <div>
              <h3 className="font-artz font-bold text-sm text-[#01406D]">{s.label}</h3>
              <p className="font-inter text-xs text-[#6B8FA3] mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
