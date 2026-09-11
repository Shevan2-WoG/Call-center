import React from 'react';
import { CallAttempt } from '../types';
import {
  History,
  X,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  FileText,
} from 'lucide-react';

interface ContactHistoryModalProps {
  contactId: string;
  contactName: string;
  attempts: CallAttempt[];
  onClose: () => void;
}

export const ContactHistoryModal: React.FC<ContactHistoryModalProps> = ({
  contactId,
  contactName,
  attempts,
  onClose,
}) => {
  const contactAttempts = attempts
    .filter((a) => a.contactId === contactId)
    .sort((a, b) => new Date(a.calledAt).getTime() - new Date(b.calledAt).getTime());

  return (
    <div className="fixed inset-0 bg-[#1e1b4b]/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#efe8fc] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between pb-4 border-b border-[#efe8fc]">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center shadow-xs">
                <History className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-[#1e1b4b]">
                  Call Attempt History
                </h3>
                <p className="text-xs text-[#7c7896] font-medium">Contact: <strong className="text-[#1e1b4b]">{contactName}</strong></p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#7c7896] hover:text-[#1e1b4b] p-1.5 rounded-xl hover:bg-[#f3efff] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 max-h-96 overflow-y-auto pr-1">
          {contactAttempts.length === 0 ? (
            <div className="text-center py-8 text-[#7c7896] text-xs font-medium">
              No previous call attempts recorded for this contact yet.
            </div>
          ) : (
            <div className="space-y-4">
              {contactAttempts.map((attempt, index) => {
                const dateStr = new Date(attempt.calledAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={attempt.id}
                    className="relative pl-6 pb-2 border-l-2 border-[#efe8fc] last:border-transparent"
                  >
                    {/* Number dot */}
                    <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-[#6c28f5] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {index + 1}
                    </div>

                    <div className="bg-[#fbf9ff] border border-[#efe8fc] rounded-2xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-black text-[#1e1b4b] text-sm">
                            Attempt {index + 1}
                          </span>
                          <span className="text-[11px] text-[#7c7896] block font-medium">
                            {dateStr}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#88d600]/15 text-[#629c00] border border-[#88d600]/30">
                          {attempt.outcome}
                        </span>
                      </div>

                      <div className="text-[#7c7896] flex items-center gap-1.5 pt-1 font-medium">
                        <User className="w-3.5 h-3.5 text-[#6c28f5]" />
                        <span>Caller: <strong className="text-[#1e1b4b]">{attempt.callerName}</strong></span>
                      </div>

                      {attempt.comment && (
                        <div className="bg-white p-3 rounded-xl border border-[#efe8fc] text-[#1e1b4b] text-xs leading-relaxed font-medium">
                          <FileText className="w-3 h-3 text-[#6c28f5] inline mr-1" />
                          {attempt.comment}
                        </div>
                      )}

                      {(attempt.followUpDate || attempt.preferredCallbackTime) && (
                        <div className="flex items-center gap-3 text-[11px] text-[#d61168] bg-[#ff2a85]/10 p-2 rounded-xl border border-[#ff2a85]/20 font-bold">
                          {attempt.followUpDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Follow-up: {attempt.followUpDate}
                            </span>
                          )}
                          {attempt.preferredCallbackTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Callback: {attempt.preferredCallbackTime}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-[#efe8fc] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#6c28f5] hover:bg-[#5816d6] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-600/20 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
