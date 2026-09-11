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
    <div className="fixed inset-0 bg-[#1e1b4b]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#efe8fc] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#efe8fc]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6c28f5] bg-[#f3efff] px-2.5 py-0.5 rounded-full border border-[#e8e1f9]">
              Call Feedback Logger
            </span>
            <h3 className="text-lg font-black text-[#1e1b4b] mt-1.5">{assignment.contactName}</h3>
            <p className="text-xs text-[#7c7896] font-mono flex items-center gap-2 mt-0.5 font-medium">
              <span className="text-[#6c28f5] font-bold">{assignment.contactPhone}</span>
              {assignment.contactLocation && <span>• {assignment.contactLocation}</span>}
              {assignment.contactCategory && <span>• {assignment.contactCategory}</span>}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#7c7896] hover:text-[#1e1b4b] p-1.5 rounded-xl hover:bg-[#f3efff] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Dial & WhatsApp triggers */}
        <div className="my-4 p-3.5 bg-[#fbf9ff] rounded-2xl border border-[#efe8fc] flex items-center justify-between">
          <div className="text-xs text-[#7c7896]">
            <span className="font-bold block text-[#1e1b4b]">Initiate Call or Chat</span>
            Click to dial or open chat with this contact
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${assignment.contactPhone}`}
              className="px-3.5 py-2 bg-[#6c28f5] hover:bg-[#5816d6] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/20"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Dial Now
            </a>
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 text-[#128C7E] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Outcomes Selection Grid */}
          <div>
            <label className="block font-bold text-[#1e1b4b] mb-1.5">
              Select Call Outcome *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {CALL_OUTCOMES.map((item) => {
                const isSelected = outcome === item;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setOutcome(item)}
                    className={`px-2.5 py-2 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#6c28f5] text-white border-[#6c28f5] shadow-md shadow-purple-600/20'
                        : 'bg-[#fbf9ff] text-[#1e1b4b] border-[#efe8fc] hover:bg-[#f3efff]'
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
            <div className="p-3.5 bg-[#ff2a85]/10 border border-[#ff2a85]/20 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold text-[#d61168] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-[#ff2a85]" />
                Schedule Follow-up Action
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#d61168] mb-1">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full bg-white px-2.5 py-1.5 border border-[#ff2a85]/30 rounded-xl text-xs outline-none font-medium text-[#1e1b4b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#d61168] mb-1">
                    Preferred Callback Time
                  </label>
                  <input
                    type="text"
                    value={preferredCallbackTime}
                    onChange={(e) => setPreferredCallbackTime(e.target.value)}
                    placeholder="e.g. 2:30 PM"
                    className="w-full bg-white px-2.5 py-1.5 border border-[#ff2a85]/30 rounded-xl text-xs outline-none font-medium text-[#1e1b4b]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block font-bold text-[#1e1b4b] mb-1">
              Feedback Comment / Conversation Summary
            </label>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Discussed course pricing. Client requested brochure on WhatsApp."
              className="w-full px-3 py-2 bg-[#fbf9ff] border border-[#efe8fc] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-xs text-[#1e1b4b] font-medium resize-none transition-all"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block font-bold text-[#7c7896] mb-1">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Lead source: Referral from Patrick"
              className="w-full px-3 py-2 bg-[#fbf9ff] border border-[#efe8fc] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-xs text-[#1e1b4b] font-medium transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-[#efe8fc] flex items-center justify-between">
            <button
              type="button"
              onClick={() => onViewHistory(assignment.contactId, assignment.contactName)}
              className="text-xs text-[#6c28f5] hover:text-[#5816d6] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#6c28f5]" />
              View History
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-[#7c7896] hover:bg-[#f3efff] rounded-xl font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#6c28f5] hover:bg-[#5816d6] text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
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
