import React from 'react';
import {
  PhoneCall,
  Headset,
  Shield,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
  BarChart2,
  Share2,
  Lock,
} from 'lucide-react';
import { Caller, Assignment, CallAttempt } from '../types';
import { formatFriendlyDate, isToday } from '../utils/dateUtils';

interface HomeViewProps {
  onEnterCallerPortal: (callerId?: string) => void;
  onOpenAdminLogin: () => void;
  callers: Caller[];
  assignments: Assignment[];
  attempts: CallAttempt[];
  callingDate: string;
  selectedCallerId?: string;
  onSelectCallerId: (id: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onEnterCallerPortal,
  onOpenAdminLogin,
  callers,
  assignments,
  attempts,
  callingDate,
  selectedCallerId,
  onSelectCallerId,
}) => {
  const totalAssigned = assignments.length;
  const completedAttempts = attempts.filter(
    (a) => a.outcome !== 'No Answer' && a.outcome !== 'Busy' && a.outcome !== 'Call Dropped'
  ).length;
  const activeCallersCount = callers.filter((c) => c.availabilityStatus === 'Active').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#1b0840] via-[#240c54] to-[#120329] text-white flex flex-col justify-between">
      {/* Background radial glow accents */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[#6c28f5]/20 blur-[120px] pointer-events-none -z-0" />
      <div className="absolute top-48 right-10 w-[400px] h-[300px] bg-[#ff2a85]/15 blur-[100px] pointer-events-none -z-0" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full">
        {/* Welcome Eyebrow Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-purple-300/20 backdrop-blur-md shadow-lg shadow-purple-950/40">
            <Sparkles className="w-3.5 h-3.5 text-[#88d600]" />
            <span className="text-xs font-bold tracking-wide text-purple-200">
              Welcome to the Official Call Center Platform
            </span>
          </div>
        </div>

        {/* HERO TITLE: KIU Manifest Call Center Hub */}
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] mb-6">
            <span className="bg-gradient-to-r from-white via-[#f3efff] to-[#e4d4ff] text-transparent bg-clip-text drop-shadow-sm">
              KIU Manifest
            </span>{' '}
            <span className="bg-gradient-to-r from-[#d8b4fe] via-white to-[#c084fc] text-transparent bg-clip-text">
              Call Center Hub
            </span>
            <span className="text-[#ff2a85]">.</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-purple-200/90 font-medium max-w-2xl mx-auto leading-relaxed">
            Centralized contact distribution, live dialing workspace, WhatsApp dispatch, and instant call feedback tracking.
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-purple-300">
            <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
              <Calendar className="w-3.5 h-3.5 text-[#88d600]" />
              <span>Active Date:</span>
              <strong className="text-white">{formatFriendlyDate(callingDate, 'long')}</strong>
              {isToday(callingDate) && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#88d600] text-[#1e1b4b] uppercase tracking-wider">
                  Auto-Renewed Daily
                </span>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/15">
              <Users className="w-3.5 h-3.5 text-purple-300" />
              <strong className="text-white">{callers.length}</strong> Agents Registered
            </span>
          </div>
        </div>

        {/* MAIN ACTION SECTION: Open Callers Portal */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-[#1e0a44]/90 backdrop-blur-md border-2 border-purple-400/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/60 relative overflow-hidden group hover:border-[#88d600]/60 transition-all duration-300">
            {/* Top accent strip */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#88d600] via-[#6c28f5] to-[#ff2a85]" />

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#88d600] flex items-center justify-center text-[#1e1b4b] shadow-lg shadow-lime-500/20 shrink-0">
                <Headset className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Caller & Agent Portal
                  </h2>
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-[#88d600] text-[#1e1b4b]">
                    Open Access
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 font-medium">
                  Instant access for calling staff to review assigned contacts and log feedback.
                </p>
              </div>
            </div>

            {/* Agent Selector (if callers exist) */}
            {callers.length > 0 ? (
              <div className="space-y-4 mb-6">
                <div>
                  <label 
                    htmlFor="home-agent-select"
                    className="block text-xs font-bold uppercase tracking-wider text-purple-200 mb-2 flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#88d600]" />
                    <span>Select Your Agent Name to Begin</span>
                  </label>
                  <div className="relative">
                    <select
                      id="home-agent-select"
                      value={selectedCallerId || (callers[0] ? callers[0].id : '')}
                      onChange={(e) => onSelectCallerId(e.target.value)}
                      className="w-full bg-[#120428] border border-purple-400/30 focus:border-[#88d600] focus:ring-2 focus:ring-[#88d600]/30 rounded-2xl px-4 py-3.5 text-sm font-bold text-white outline-none cursor-pointer transition-all"
                    >
                      {callers.map((c) => (
                        <option key={c.id} value={c.id} className="text-[#1e1b4b] bg-white font-semibold">
                          {c.name} ({c.whatsappNumber}) — Status: {c.availabilityStatus}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onEnterCallerPortal(selectedCallerId || (callers[0] ? callers[0].id : undefined))}
                  className="w-full py-4 px-6 rounded-2xl bg-[#88d600] hover:bg-[#9bf000] active:scale-[0.99] text-[#1e1b4b] font-black text-base shadow-xl shadow-lime-950/40 flex items-center justify-center gap-3 transition-all cursor-pointer group"
                >
                  <PhoneCall className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Enter Caller Workspace</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ) : (
              <div className="mb-6 p-4 rounded-2xl bg-[#120428] border border-purple-500/20 text-center">
                <p className="text-xs text-purple-300 mb-3">
                  No caller accounts registered yet. Administrators can register agents via the Admin Portal.
                </p>
                <button
                  type="button"
                  onClick={() => onEnterCallerPortal()}
                  className="py-3 px-6 rounded-xl bg-[#88d600] text-[#1e1b4b] font-bold text-xs cursor-pointer shadow-md"
                >
                  Open Call Portal Queue
                </button>
              </div>
            )}

            {/* Micro Highlights */}
            <div className="pt-4 border-t border-purple-500/20 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-base font-black text-white">{activeCallersCount}</div>
                <div className="text-[10px] text-purple-300 font-semibold">Active Agents</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-base font-black text-[#88d600]">{totalAssigned}</div>
                <div className="text-[10px] text-purple-300 font-semibold">Assigned Contacts</div>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                <div className="text-base font-black text-[#ff2a85]">{attempts.length}</div>
                <div className="text-[10px] text-purple-300 font-semibold">Calls Logged</div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow steps */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-purple-300/80">
              Simple 3-Step Calling Routine
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-purple-400/20 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-[#6c28f5] flex items-center justify-center font-black text-sm text-white mb-3">
                1
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Pick Your Name</h4>
              <p className="text-xs text-purple-200/70 leading-relaxed">
                Choose your agent profile to load your personalized contact queue instantly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-purple-400/20 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-[#ff2a85] flex items-center justify-center font-black text-sm text-white mb-3">
                2
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Dial Contacts</h4>
              <p className="text-xs text-purple-200/70 leading-relaxed">
                Connect with respondents directly and communicate the KIU Manifest points.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-purple-400/20 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-[#88d600] flex items-center justify-center font-black text-sm text-[#1e1b4b] mb-3">
                3
              </div>
              <h4 className="font-bold text-sm text-white mb-1">Record Outcome</h4>
              <p className="text-xs text-purple-200/70 leading-relaxed">
                Log feedback (Connected, Callback, Voicemail) with timestamped records.
              </p>
            </div>
          </div>
        </div>

        {/* Discreet Admin Portal Access Button at Bottom */}
        <div className="max-w-md mx-auto pt-6 border-t border-purple-500/20 text-center">
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#150530] hover:bg-[#1f0945] border border-purple-400/30 text-purple-200 hover:text-white text-xs font-bold transition-all shadow-md cursor-pointer group"
          >
            <Lock className="w-3.5 h-3.5 text-[#ff2a85] group-hover:scale-110 transition-transform" />
            <span>Administrator Portal Access</span>
            <span className="text-[10px] text-purple-400 font-normal">(Password required)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
