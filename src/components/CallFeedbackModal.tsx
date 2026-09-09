import React, { useState } from 'react';
import { Assignment, CallOutcome, CALL_OUTCOMES, CallAttempt } from '../types';
import {
  PhoneCall,
  CheckCircle2,
  Calendar,
  Clock,
  MessageSquare,
  X,
  History,
  AlertCircle,
} from 'lucide-react';

interface CallFeedbackModalProps {
  assignment: Assignment;
  callerName: string;
  callerId: string;
  onSaveAttempt: (attempt: Omit<CallAttempt, 'id' | 'calledAt'>) => Promise<void>;
  onClose: () => void;
  onViewHistory: (contactId: string, contactName: string) => void;
}

export const CallFeedbackModal: React.FC<CallFeedbackModalProps> = ({
  assignment,
  callerName,
  callerId,
  onSaveAttempt,
  onClose,
  onViewHistory,
}) => {
  const [outcome, setOutcome] = useState<CallOutcome>('Available');
  const [comment, setComment] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [preferredCallbackTime, setPreferredCallbackTime] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanPhone = assignment.contactPhone.replace(/[^0-9]/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveAttempt({
        contactId: assignment.contactId,
        callerId,
        callerName,
        assignmentId: assignment.id,
        outcome,
        comment: comment.trim(),
        followUpDate: followUpDate || undefined,
        preferredCallbackTime: preferredCallbackTime || undefined,
        additionalNotes: additionalNotes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFollowUp = outcome === 'Follow-up Required' || outcome === 'Recall';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Call Feedback Logger
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1.5">{assignment.contactName}</h3>
            <p className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
              <span>{assignment.contactPhone}</span>
              {assignment.contactLocation && <span>• {assignment.contactLocation}</span>}
              {assignment.contactCategory && <span>• {assignment.contactCategory}</span>}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Dial & WhatsApp triggers */}
        <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600">
            <span className="font-semibold block text-slate-900">Initiate Call or Chat</span>
            Click to dial or open chat with this contact
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${assignment.contactPhone}`}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Dial Now
            </a>
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Outcomes Selection Grid */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Select Call Outcome * (Spec Section 12)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {CALL_OUTCOMES.map((item) => {
                const isSelected = outcome === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setOutcome(item)}
                    className={`px-2.5 py-2 rounded-lg text-left text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Follow-up Fields if relevant */}
          {isFollowUp && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Schedule Follow-up Action
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-amber-900 mb-1">
                    Follow-up Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full bg-white px-2.5 py-1.5 border border-amber-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-amber-900 mb-1">
                    Preferred Callback Time
                  </label>
                  <input
                    type="text"
                    value={preferredCallbackTime}
                    onChange={(e) => setPreferredCallbackTime(e.target.value)}
                    placeholder="e.g. 2:30 PM"
                    className="w-full bg-white px-2.5 py-1.5 border border-amber-200 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Feedback Comment / Conversation Summary
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Discussed course pricing. Client requested brochure on WhatsApp."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block font-medium text-slate-600 mb-1">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Lead source: Referral from Patrick"
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 text-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onViewHistory(assignment.contactId, assignment.contactName)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              View Contact History
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save Feedback'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
