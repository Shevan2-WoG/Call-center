import React, { useState } from 'react';
import { Caller, AvailabilityStatus } from '../types';
import { normalizePhoneNumber } from '../services/excelService';
import {
  Users,
  UserPlus,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  ExternalLink,
  Target,
  Plus,
  Headset,
  ShieldCheck,
  Sparkles,
  Lock,
  Trash2,
} from 'lucide-react';

interface CallerTeamViewProps {
  callers: Caller[];
  callingDate: string;
  onSaveCaller: (caller: Caller) => Promise<void>;
  onDeleteCaller?: (id: string) => Promise<void>;
  onTriggerReassignment?: (caller: Caller) => void;
  onSwitchToCaller?: (callerId: string) => void;
}

export const CallerTeamView: React.FC<CallerTeamViewProps> = ({
  callers,
  callingDate,
  onSaveCaller,
  onDeleteCaller,
  onTriggerReassignment,
  onSwitchToCaller,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCaller, setEditingCaller] = useState<Caller | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [teamGroup, setTeamGroup] = useState('Kampala Central');
  const [targetCalls, setTargetCalls] = useState(30);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>('available');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setPhone('');
    setWhatsappNumber('');
    setTeamGroup('Kampala Central');
    setTargetCalls(30);
    setAvailabilityStatus('available');
    setFormError(null);
    setEditingCaller(null);
    setShowAddModal(false);
  };

  const handleOpenEdit = (caller: Caller) => {
    setEditingCaller(caller);
    setName(caller.name);
    setPhone(caller.phone);
    setWhatsappNumber(caller.whatsappNumber);
    setTeamGroup(caller.teamGroup || 'Kampala Central');
    setTargetCalls(caller.targetCalls || 30);
    setAvailabilityStatus(caller.availabilityStatus);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Caller Name is required');
      return;
    }

    const normPhone = normalizePhoneNumber(phone);
    if (!normPhone.isValid) {
      setFormError(`Invalid Phone: ${normPhone.error}`);
      return;
    }

    const normWa = normalizePhoneNumber(whatsappNumber || phone);
    if (!normWa.isValid) {
      setFormError(`Invalid WhatsApp Number: ${normWa.error}`);
      return;
    }

    const callerData: Caller = {
      id: editingCaller ? editingCaller.id : `caller_${Date.now()}`,
      name: name.trim(),
      phone: normPhone.normalized,
      whatsappNumber: normWa.normalized,
      teamGroup: teamGroup.trim(),
      targetCalls: Number(targetCalls) || 30,
      availabilityStatus,
      createdAt: editingCaller ? editingCaller.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await onSaveCaller(callerData);
    resetForm();
  };

  const handleToggleAvailability = async (caller: Caller, newStatus: AvailabilityStatus) => {
    const updated: Caller = {
      ...caller,
      availabilityStatus: newStatus,
      updatedAt: new Date().toISOString(),
    };
    await onSaveCaller(updated);

    if (newStatus === 'unavailable' && onTriggerReassignment) {
      onTriggerReassignment(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5 text-[#6c28f5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-[#1e1b4b]">
                  Calling Team Roster (Permanent &amp; Abiding)
                </h2>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#88d600]/15 text-[#558800] border border-[#88d600]/30 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#558800]" />
                  Entered Once • Abides Forever
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f3efff] text-[#6c28f5] border border-[#e8e1f9]">
                  {callers.length} Registered
                </span>
              </div>
              <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
                Callers registered here abide permanently in the system. They are constant across all dates and never need to be re-entered each day.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 bg-[#6c28f5] hover:bg-[#5816d6] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add Permanent Caller
        </button>
      </div>

      {/* Permanence & Constancy Assurance Banner */}
      <div className="bg-[#f2e7fe] border border-[#d8bbfb] rounded-2xl p-4 flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-xl bg-[#6c28f5] text-white flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-xs">
          <span className="font-black text-[#1e1b4b] flex items-center gap-1.5">
            <span>Team Caller Management &amp; Persistence</span>
            <span className="px-2 py-0.2 bg-[#6c28f5] text-white text-[10px] font-extrabold rounded-md flex items-center gap-0.5">
              <Users className="w-2.5 h-2.5" /> Caller Directory
            </span>
          </span>
          <p className="text-[#645f82] font-medium leading-relaxed">
            Registered callers persist across all daily campaigns. As an administrator, you can add new callers, edit phone numbers, toggle daily availability to <strong>&ldquo;Off&rdquo;</strong>, or delete callers who are no longer on the team.
          </p>
        </div>
      </div>

      {/* Callers Grid */}
      {callers.length === 0 ? (
        <div className="bg-[#fbf7fe] rounded-3xl border border-dashed border-[#cbaff8] p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-[#1e1b4b] mb-1">No Callers Registered Yet</h3>
          <p className="text-xs text-[#7c7896] max-w-md mx-auto mb-6 font-medium">
            Enter your call center agents once. They will abide permanently in the system and remain constant for all future campaigns and daily distributions.
          </p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6c28f5] hover:bg-[#5816d6] text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add First Permanent Caller
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {callers.map((caller) => {
          const isAvail = caller.availabilityStatus === 'available';
          const isBusy = caller.availabilityStatus === 'busy';
          const cleanWa = caller.whatsappNumber.replace(/[^0-9]/g, '');

          return (
            <div
              key={caller.id}
              className={`rounded-3xl border p-5 transition-all shadow-sm ${
                isAvail
                  ? 'bg-[#fbf7fe] border-[#e2d0fa] hover:border-[#6c28f5]/40 hover:bg-[#f8f2fe]'
                  : 'border-[#ffb800]/40 bg-[#fffbeb]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-[#1e1b4b] text-base">{caller.name}</h3>
                    <span className="text-[10px] font-extrabold text-[#6c28f5] bg-[#f3efff] px-2 py-0.5 rounded-md border border-[#e2d0fa] inline-flex items-center gap-1" title="Permanent caller preserved across Excel deletes">
                      <ShieldCheck className="w-3 h-3 text-[#6c28f5]" />
                      Abiding
                    </span>
                  </div>
                  <span className="text-xs text-[#7c7896] mt-0.5 block font-medium">
                    Team: <strong className="text-[#1e1b4b]">{caller.teamGroup || 'General'}</strong>
                  </span>
                </div>

                {/* Availability Badge */}
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border flex items-center gap-1 ${
                      isAvail
                        ? 'bg-[#88d600]/15 text-[#629c00] border-[#88d600]/30'
                        : isBusy
                        ? 'bg-[#ffb800]/15 text-[#b47800] border-[#ffb800]/30'
                        : 'bg-[#ff2a85]/15 text-[#ff2a85] border-[#ff2a85]/30'
                    }`}
                  >
                    {isAvail ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#88d600]" />
                    ) : isBusy ? (
                      <Clock className="w-3.5 h-3.5 text-[#ffb800]" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-[#ff2a85]" />
                    )}
                    {caller.availabilityStatus}
                  </span>
                </div>
              </div>

              {/* Contact Info & Target */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#7c7896]">
                  <span className="flex items-center gap-1.5 text-[#7c7896] font-medium">
                    <Phone className="w-3.5 h-3.5 text-[#6c28f5]" />
                    Direct Phone:
                  </span>
                  <span className="font-mono font-bold text-[#1e1b4b]">{caller.phone}</span>
                </div>

                <div className="flex items-center justify-between text-[#7c7896]">
                  <span className="flex items-center gap-1.5 text-[#7c7896] font-medium">
                    <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                    WhatsApp:
                  </span>
                  <a
                    href={`https://wa.me/${cleanWa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-[#128C7E] hover:underline flex items-center gap-1"
                    title="Test WhatsApp connection"
                  >
                    {caller.whatsappNumber}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between text-[#7c7896]">
                  <span className="flex items-center gap-1.5 text-[#7c7896] font-medium">
                    <Target className="w-3.5 h-3.5 text-[#ff2a85]" />
                    Target Calls:
                  </span>
                  <span className="font-bold text-[#1e1b4b]">{caller.targetCalls || 30} calls</span>
                </div>
              </div>

              {/* Status Switcher & Actions */}
              <div className="mt-4 pt-3 border-t border-[#e2d0fa] flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[11px] text-[#7c7896] mr-1 font-bold">Status:</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(caller, 'available')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isAvail ? 'bg-[#88d600] text-white shadow-xs' : 'bg-[#f3e9fd] text-[#7c7896] hover:bg-[#ede0fc]'
                    }`}
                  >
                    Avail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(caller, 'busy')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isBusy ? 'bg-[#ffb800] text-white shadow-xs' : 'bg-[#f3e9fd] text-[#7c7896] hover:bg-[#ede0fc]'
                    }`}
                  >
                    Busy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(caller, 'unavailable')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      caller.availabilityStatus === 'unavailable'
                        ? 'bg-[#ff2a85] text-white shadow-xs'
                        : 'bg-[#f3e9fd] text-[#7c7896] hover:bg-[#ede0fc]'
                    }`}
                    title="Mark unavailable & prompt reassignment"
                  >
                    Off
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {onSwitchToCaller && (
                    <button
                      type="button"
                      onClick={() => onSwitchToCaller(caller.id)}
                      className="px-2.5 py-1 text-[11px] font-bold text-[#6c28f5] hover:bg-[#6c28f5] hover:text-white bg-[#f3efff] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      title="Open this agent's Caller Portal workspace"
                    >
                      <Headset className="w-3 h-3" />
                      <span>Open Portal</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(caller)}
                    className="p-1.5 text-[#7c7896] hover:text-[#6c28f5] hover:bg-[#f3efff] rounded-lg transition-colors cursor-pointer"
                    title="Edit caller details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {onDeleteCaller && (
                    <button
                      type="button"
                      onClick={() => onDeleteCaller(caller.id)}
                      className="p-1.5 text-[#ff2a85] hover:text-red-700 hover:bg-[#fff0f4] rounded-lg transition-colors cursor-pointer"
                      title="Delete this caller"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add / Edit Caller Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#1e1b4b]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#fbf7fe] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e2d0fa] animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-[#1e1b4b] mb-1">
              {editingCaller ? 'Edit Caller Information' : 'Add Permanent Caller'}
            </h3>
            <p className="text-xs text-[#7c7896] mb-4 font-medium">
              Enter caller contact details and WhatsApp phone number. Callers are registered once and abide permanently across all days and campaigns.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-[#fff1f2] text-[#ff2a85] text-xs rounded-2xl border border-[#fecdd3] font-bold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#1e1b4b] mb-1">Caller Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Caller E (Florence Babirye)"
                  className="w-full px-3.5 py-2.5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-medium transition-all"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#1e1b4b] mb-1">Direct Phone Number *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (!whatsappNumber) setWhatsappNumber(e.target.value);
                  }}
                  placeholder="e.g. +256 701 234 567"
                  className="w-full px-3.5 py-2.5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-mono font-medium transition-all"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#1e1b4b] mb-1">WhatsApp-Enabled Number *</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +256 701 234 567"
                  className="w-full px-3.5 py-2.5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-mono font-medium transition-all"
                  required
                />
                <span className="text-[11px] text-[#7c7896] mt-1 block font-medium">
                  Used by the system to dispatch WhatsApp-ready contact lists.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1e1b4b] mb-1">Team / Group</label>
                  <input
                    type="text"
                    value={teamGroup}
                    onChange={(e) => setTeamGroup(e.target.value)}
                    placeholder="e.g. Kampala Central"
                    className="w-full px-3.5 py-2.5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1e1b4b] mb-1">Target Calls</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={targetCalls}
                    onChange={(e) => setTargetCalls(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1e1b4b] mb-1">Initial Availability</label>
                <select
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                  className="w-full px-3.5 py-2.5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-medium transition-all cursor-pointer"
                >
                  <option value="available">Available (Ready for assignment)</option>
                  <option value="busy">Busy (In training / partial)</option>
                  <option value="unavailable">Unavailable (Off duty)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#e2d0fa] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-[#7c7896] hover:bg-[#f3efff] rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6c28f5] hover:bg-[#5816d6] text-white rounded-xl font-bold transition-all cursor-pointer shadow-md shadow-purple-600/20"
                >
                  {editingCaller ? 'Update Caller Details' : 'Save Permanent Caller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
