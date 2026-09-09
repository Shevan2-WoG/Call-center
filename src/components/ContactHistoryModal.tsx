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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <History className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Call Attempt History (Spec Section 13)
                </h3>
                <p className="text-xs text-slate-500">Contact: {contactName}</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 max-h-96 overflow-y-auto pr-1">
          {contactAttempts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
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
                    className="relative pl-6 pb-2 border-l-2 border-slate-200 last:border-transparent"
                  >
                    {/* Number dot */}
                    <div className="absolute -left-2.5 top-0 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                      {index + 1}
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-bold text-slate-900 text-sm">
                            Attempt {index + 1}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {dateStr}
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {attempt.outcome}
                        </span>
                      </div>

                      <div className="text-slate-600 flex items-center gap-1.5 pt-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Caller: <strong>{attempt.callerName}</strong></span>
                      </div>

                      {attempt.comment && (
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-slate-700 text-xs leading-relaxed">
                          <FileText className="w-3 h-3 text-slate-400 inline mr-1" />
                          {attempt.comment}
                        </div>
                      )}

                      {(attempt.followUpDate || attempt.preferredCallbackTime) && (
                        <div className="flex items-center gap-3 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-md border border-amber-200">
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

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
