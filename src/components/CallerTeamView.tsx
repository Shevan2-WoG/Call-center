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
  Trash2,
  Edit2,
  ExternalLink,
  Target,
  Plus,
} from 'lucide-react';

interface CallerTeamViewProps {
  callers: Caller[];
  callingDate: string;
  onSaveCaller: (caller: Caller) => Promise<void>;
  onDeleteCaller: (id: string) => Promise<void>;
  onTriggerReassignment: (caller: Caller) => void;
}

export const CallerTeamView: React.FC<CallerTeamViewProps> = ({
  callers,
  callingDate,
  onSaveCaller,
  onDeleteCaller,
  onTriggerReassignment,
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

    if (newStatus === 'unavailable') {
      onTriggerReassignment(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-3xl border border-[#efe8fc] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5 text-[#6c28f5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#1e1b4b]">
                  Daily Calling Team & Availability
                </h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#f3efff] text-[#6c28f5] border border-[#e8e1f9]">
                  {callingDate}
                </span>
              </div>
              <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
                Register available callers, verify WhatsApp-enabled numbers, set daily call targets, and manage shifts.
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
          Register New Caller
        </button>
      </div>

      {/* Callers Grid */}
      {callers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#efe8fc] p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-[#1e1b4b] mb-1">No Daily Callers Registered</h3>
          <p className="text-xs text-[#7c7896] max-w-md mx-auto mb-6 font-medium">
            Register the callers available to make calls today along with their WhatsApp phone numbers to distribute contacts equally.
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
            Register First Caller
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
              className={`bg-white rounded-3xl border p-5 transition-all shadow-sm ${
                isAvail
                  ? 'border-[#efe8fc] hover:border-[#6c28f5]/40'
                  : 'border-[#ffb800]/30 bg-[#ffb800]/5'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-black text-[#1e1b4b] text-base">{caller.name}</h3>
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
              <div className="mt-4 pt-3 border-t border-[#efe8fc] flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[11px] text-[#7c7896] mr-1 font-bold">Status:</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(caller, 'available')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isAvail ? 'bg-[#88d600] text-white shadow-xs' : 'bg-[#fbf9ff] text-[#7c7896] hover:bg-[#f3efff]'
                    }`}
                  >
                    Avail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(caller, 'busy')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      isBusy ? 'bg-[#ffb800] text-white shadow-xs' : 'bg-[#fbf9ff] text-[#7c7896] hover:bg-[#f3efff]'
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
                        : 'bg-[#fbf9ff] text-[#7c7896] hover:bg-[#f3efff]'
                    }`}
                    title="Mark unavailable & prompt reassignment"
                  >
                    Off
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(caller)}
                    className="p-1.5 text-[#7c7896] hover:text-[#6c28f5] hover:bg-[#f3efff] rounded-lg transition-colors cursor-pointer"
                    title="Edit caller details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove ${caller.name} from the team?`)) {
                        onDeleteCaller(caller.id);
                      }
                    }}
                    className="p-1.5 text-[#7c7896] hover:text-[#ff2a85] hover:bg-[#fff1f2] rounded-lg transition-colors cursor-pointer"
                    title="Delete caller"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#efe8fc] animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-[#1e1b4b] mb-1">
              {editingCaller ? 'Edit Caller Information' : 'Register Daily Caller'}
            </h3>
            <p className="text-xs text-[#7c7896] mb-4 font-medium">
              Enter caller contact details and WhatsApp-enabled phone number for automatic distribution.
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
                  className="w-full px-3.5 py-2.5 bg-[#fbf9ff] border border-[#efe8fc] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-medium transition-all"
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
                  className="w-full px-3.5 py-2.5 bg-[#fbf9ff] border border-[#efe8fc] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-mono font-medium transition-all"
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
                  className="w-full px-3.5 py-2.5 bg-[#fbf9ff] border border-[#efe8fc] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-mono font-medium transition-all"
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
                    className="w-full px-3.5 py-2.5 bg-[#fbf9ff] border border-[#efe8fc] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-medium transition-all"
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
                    className="w-full px-3.5 py-2.5 bg-[#fbf9ff] border border-[#efe8fc] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1e1b4b] mb-1">Initial Availability</label>
                <select
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                  className="w-full px-3.5 py-2.5 bg-[#fbf9ff] border border-[#efe8fc] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-medium transition-all cursor-pointer"
                >
                  <option value="available">Available (Ready for assignment)</option>
                  <option value="busy">Busy (In training / partial)</option>
                  <option value="unavailable">Unavailable (Off duty)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#efe8fc] flex items-center justify-end gap-2">
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
                  {editingCaller ? 'Update Caller' : 'Save Caller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
