import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Plus,
  Send,
  Calendar,
  Layers,
  PhoneCall,
  Users,
  CheckCircle2,
  Clock,
  Flame,
  FileSpreadsheet,
} from 'lucide-react';

interface HeroWidgetsRowProps {
  unassignedCount: number;
  assignedCount: number;
  completedCount: number;
  callersCount: number;
  callingDate: string;
  onNavigateTab: (tab: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const HeroWidgetsRow: React.FC<HeroWidgetsRowProps> = ({
  unassignedCount,
  assignedCount,
  completedCount,
  callersCount,
  callingDate,
  onNavigateTab,
  selectedCategory,
  setSelectedCategory,
}) => {
  const categories = [
    { id: 'all', label: 'All Leads', icon: Layers, count: unassignedCount + assignedCount },
    { id: 'unassigned', label: 'Unassigned', icon: FileSpreadsheet, count: unassignedCount },
    { id: 'assigned', label: 'In Queue', icon: PhoneCall, count: assignedCount },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, count: completedCount },
    { id: 'callers', label: 'Callers', icon: Users, count: callersCount },
    { id: 'priority', label: 'Priority', icon: Flame, count: Math.min(unassignedCount, 15) },
  ];

  return (
    <div className="space-y-5 pt-2">
      {/* Top Split: Banner on Left + Floating Balance Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Promo Card (matching "Get Discount Voucher Up To 20%" in the PNG) */}
        <div className="lg:col-span-7 xl:col-span-8 relative bg-gradient-to-r from-[#1e1b4b] via-[#2d1266] to-[#4e0fb8] rounded-3xl p-6 sm:p-7 text-white overflow-hidden shadow-lg shadow-purple-950/20 flex flex-col justify-between min-h-[190px]">
          {/* Subtle background glow */}
          <div className="absolute -right-10 -bottom-10 w-52 h-52 bg-[#6c28f5]/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-12 top-4 opacity-15">
            <PhoneCall className="w-36 h-36 text-white" />
          </div>

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#ff2a85] text-white shadow-xs mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Fair Share Engine Active
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight max-w-md text-white">
              Contact Distribution & WhatsApp Dispatch
            </h2>
            <p className="text-xs text-purple-200/90 mt-1.5 max-w-md font-medium leading-relaxed">
              Equally distribute contacts among today&apos;s active callers with zero duplicates, instant WhatsApp links, and feedback logging.
            </p>
          </div>

          <div className="relative z-10 pt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className="px-4 py-2 bg-[#6c28f5] hover:bg-[#5816d6] text-white text-xs font-bold rounded-xl shadow-md shadow-purple-900/40 flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Distribute Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('contacts')}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl backdrop-blur-xs transition-colors cursor-pointer"
            >
              Import Excel
            </button>
          </div>
        </div>

        {/* Right Card: Floating Balance Widget (Matching the Floating Balance Card in PNG) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-[#fbf7fe] rounded-3xl p-5 border border-[#e2d0fa] shadow-lg shadow-purple-900/5 flex flex-col justify-between">
          {/* Top Row: Purple Balance Pill + 2 Lime Green Action Buttons */}
          <div className="flex items-center justify-between gap-3">
            {/* Balance Pill with Purple Header */}
            <div className="bg-[#f8f2fe] border border-[#e2d0fa] rounded-2xl p-3 flex-1">
              <div className="inline-block bg-[#6c28f5] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
                Leads Pool
              </div>
              <div className="text-2xl font-black text-[#1e1b4b] tracking-tight">
                {unassignedCount.toLocaleString()}
                <span className="text-xs font-semibold text-[#7c7896] ml-1.5">Ready</span>
              </div>
            </div>

            {/* Lime Green Action Buttons: "Top Up" and "Transfer" from PNG */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigateTab('contacts')}
                title="Import / Add Contacts"
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-[#88d600] hover:bg-[#78be00] text-white w-14 h-16 shadow-md shadow-lime-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Import</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('dashboard')}
                title="Distribute / Transfer Contacts"
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-[#88d600] hover:bg-[#78be00] text-white w-14 h-16 shadow-md shadow-lime-600/20 transition-all cursor-pointer"
              >
                <Send className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-bold">Dispatch</span>
              </button>
            </div>
          </div>

          {/* Bottom Card: "Your Address / Campaign Details" from PNG */}
          <div className="mt-3.5 bg-[#f8f2fe] rounded-2xl p-3 border border-[#e2d0fa] text-xs">
            <div className="flex items-center justify-between text-[#7c7896] mb-1">
              <span className="font-semibold text-[11px]">Calling Session</span>
              <button
                type="button"
                onClick={() => onNavigateTab('dashboard')}
                className="text-[11px] text-[#6c28f5] font-bold hover:underline cursor-pointer"
              >
                Change
              </button>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-[#1e1b4b]">
              <Calendar className="w-3.5 h-3.5 text-[#6c28f5]" />
              <span>Date: {callingDate} • Active Shift</span>
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#e2d0fa]">
              <button
                type="button"
                onClick={() => onNavigateTab('callers')}
                className="px-2.5 py-1 bg-[#fbf7fe] hover:bg-[#efe0fc] text-[#1e1b4b] border border-[#e2d0fa] rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Callers ({callersCount})
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="px-2.5 py-1 bg-[#fbf7fe] hover:bg-[#efe0fc] text-[#1e1b4b] border border-[#e2d0fa] rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Reports
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills Row (matching "Burger", "Salad", "Green Tea", "Pizza", "Pancake", "Fries" in PNG) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[#1e1b4b] tracking-tight">Campaign Category</h3>
          <span className="text-xs font-bold text-[#6c28f5] hover:underline cursor-pointer">
            View all &gt;
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all cursor-pointer text-center ${
                  isSelected
                    ? 'bg-[#6c28f5] text-white shadow-lg shadow-purple-600/30 scale-[1.02]'
                    : 'bg-[#fbf7fe] hover:bg-[#f3e9fd] border border-[#e2d0fa] text-[#1e1b4b]'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#f3efff] text-[#6c28f5]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold truncate max-w-full">{cat.label}</span>
                <span
                  className={`text-[10px] font-semibold mt-0.5 ${
                    isSelected ? 'text-purple-200' : 'text-[#7c7896]'
                  }`}
                >
                  {cat.count} items
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
