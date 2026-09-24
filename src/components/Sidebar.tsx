import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  RotateCcw,
  Headset,
  BarChart3,
  History,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentRole: UserRole;
  onResetData: () => void;
  onOpenQuickDistribute?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentRole,
  onResetData,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'tech_lead'] },
    { id: 'contacts', label: 'Contacts & Import', icon: FileSpreadsheet, roles: ['admin', 'tech_lead'] },
    { id: 'callers', label: 'Permanent Callers', icon: Users, roles: ['admin', 'tech_lead'] },
    { id: 'caller_dashboard', label: 'Caller Dashboard', icon: Headset, roles: ['admin', 'caller', 'tech_lead'] },
    { id: 'reports', label: 'Order / Reports', icon: BarChart3, roles: ['admin', 'tech_lead'] },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(currentRole));

  return (
    <aside className="relative flex flex-col justify-between h-full p-4 select-none">
      {/* Background Shadow Under-layer (matching the offset dark purple card in the PNG) */}
      <div className="absolute inset-0 top-3 left-1 right-2 bottom-1 bg-[#4e0fb8] rounded-[30px] -z-10 shadow-lg shadow-purple-950/30" />

      {/* Main Front Purple Sidebar Card */}
      <div className="relative bg-[#6c28f5] rounded-[28px] p-5 flex flex-col justify-between h-full text-white shadow-xl shadow-purple-700/30 border border-purple-400/20">
        <div>
          {/* Logo Header (matching "FoodMeal." with clean white typography & dot) */}
          <div className="flex items-center gap-2.5 px-2 py-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white backdrop-blur-xs">
              <PhoneCall className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white font-sans">
              CallHub<span className="text-white">.</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#6c28f5] shadow-md shadow-black/10 scale-[1.02]'
                      : 'text-purple-100/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 ${
                      isActive ? 'text-[#6c28f5]' : 'text-purple-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Promo / Operations Capacity Card (matching the upgrade card in the PNG) */}
        <div className="mt-6 bg-[#ece5ff] rounded-2xl p-4 text-[#1e1b4b] relative overflow-hidden shadow-inner border border-purple-200/60">
          {/* Decorative Dot Matrix in top right */}
          <div className="absolute top-2.5 right-2.5 grid grid-cols-3 gap-1 opacity-40">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-[#6c28f5]" />
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6c28f5] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Engine</span>
            </div>
            <h4 className="text-xs font-black text-[#1e1b4b] leading-tight mb-1">
              Fair Share & Equal Distribution
            </h4>
            <p className="text-[11px] text-[#7c7896] leading-relaxed mb-3">
              Rotational load balancer ensures every agent receives equal contacts.
            </p>
            <button
              type="button"
              onClick={onResetData}
              title="Load demo sample callers & contacts"
              className="w-full py-2 px-3 bg-[#6c28f5] hover:bg-[#5816d6] active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Demo Dataset</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
