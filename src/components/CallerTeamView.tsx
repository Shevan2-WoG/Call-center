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
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Daily Calling Team & Availability
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {callingDate}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Register available callers, verify WhatsApp-enabled numbers, set daily call targets, and manage shifts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Register New Caller
        </button>
      </div>

      {/* Callers Grid */}
      {callers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-2xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">No Daily Callers Registered</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Register the callers available to make calls today along with their WhatsApp phone numbers to distribute contacts equally.
          </p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
              className={`bg-white rounded-xl border p-5 transition-all shadow-2xs ${
                isAvail
                  ? 'border-slate-200 hover:border-slate-300'
                  : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{caller.name}</h3>
                  <span className="text-xs text-slate-500 mt-0.5 block">
                    Team: <strong className="text-slate-700">{caller.teamGroup || 'General'}</strong>
                  </span>
                </div>

                {/* Availability Badge */}
                <div className="flex items-center gap-1">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1 ${
                      isAvail
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isBusy
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {isAvail ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : isBusy ? (
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                    )}
                    {caller.availabilityStatus}
                  </span>
                </div>
              </div>

              {/* Contact Info & Target */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    Direct Phone:
                  </span>
                  <span className="font-mono font-medium text-slate-800">{caller.phone}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    WhatsApp:
                  </span>
                  <a
                    href={`https://wa.me/${cleanWa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-medium text-emerald-700 hover:underline flex items-center gap-1"
                    title="Test WhatsApp connection"
                  >
                    {caller.whatsappNumber}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Target className="w-3.5 h-3.5 text-blue-500" />
                    Target Calls:
                  </span>
                  <span className="font-bold text-slate-800">{caller.targetCalls || 30} calls</span>
                </div>
              </div>

              {/* Status Switcher & Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-[11px] text-slate-400 mr-1">Status:</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(caller, 'available')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      isAvail ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Avail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(caller, 'busy')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      isBusy ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Busy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAvailability(caller, 'unavailable')}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      caller.availabilityStatus === 'unavailable'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
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
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingCaller ? 'Edit Caller Information' : 'Register Daily Caller'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter caller contact details and WhatsApp-enabled phone number for automatic distribution.
            </p>

            {formError && (
              <div className="mb-4 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Caller Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Caller E (Florence Babirye)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Direct Phone Number *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (!whatsappNumber) setWhatsappNumber(e.target.value);
                  }}
                  placeholder="e.g. +256 701 234 567"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">WhatsApp-Enabled Number *</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +256 701 234 567"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Used by the system to dispatch WhatsApp-ready contact lists.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Team / Group</label>
                  <input
                    type="text"
                    value={teamGroup}
                    onChange={(e) => setTeamGroup(e.target.value)}
                    placeholder="e.g. Kampala Central"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Calls</label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={targetCalls}
                    onChange={(e) => setTargetCalls(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Initial Availability</label>
                <select
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as AvailabilityStatus)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs"
                >
                  <option value="available">Available (Ready for assignment)</option>
                  <option value="busy">Busy (In training / partial)</option>
                  <option value="unavailable">Unavailable (Off duty)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-2xs"
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
