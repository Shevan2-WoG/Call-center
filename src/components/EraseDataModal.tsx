import React, { useState, useMemo } from 'react';
import { Contact, Caller, Assignment, SelectiveEraseOptions, ExcelUploadBatch } from '../types';
import { getExcelUploadBatches } from '../services/dbService';
import {
  Trash2,
  X,
  FileSpreadsheet,
  ShieldCheck,
  Lock,
  AlertTriangle,
  CheckSquare,
  Square,
  CheckCircle2,
  Users,
  RotateCcw,
  ListFilter,
  History,
  Info,
} from 'lucide-react';

interface EraseDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  callers: Caller[];
  assignments: Assignment[];
  onExecuteErase: (options: SelectiveEraseOptions) => Promise<void>;
  isSyncing?: boolean;
}

export const EraseDataModal: React.FC<EraseDataModalProps> = ({
  isOpen,
  onClose,
  contacts,
  callers,
  assignments,
  onExecuteErase,
  isSyncing = false,
}) => {
  // Mode: 'excel_selection' | 'all_excels' | 'custom_components'
  const [eraseMode, setEraseMode] = useState<'excel_selection' | 'all_excels' | 'custom_components'>('excel_selection');

  // Selected Excel sources to erase
  const [selectedExcelSources, setSelectedExcelSources] = useState<string[]>([]);

  // Granular options
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [clearAssignments, setClearAssignments] = useState(false);
  const [clearCallLogs, setClearCallLogs] = useState(false);

  // Quick confirmation text requirement for safety
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute Excel batches
  const excelBatches = useMemo(() => {
    return getExcelUploadBatches(contacts, assignments);
  }, [contacts, assignments]);

  // Total contacts in selected Excels
  const selectedContactCount = useMemo(() => {
    if (eraseMode === 'all_excels') {
      return contacts.length;
    }
    const sourcesSet = new Set(selectedExcelSources.map((s) => s.toLowerCase()));
    return contacts.filter((c) => {
      const src = (c.source || 'Excel 1 (Initial Import)').toLowerCase();
      if (!sourcesSet.has(src)) return false;
      if (unassignedOnly) return c.status === 'unassigned';
      return true;
    }).length;
  }, [contacts, selectedExcelSources, eraseMode, unassignedOnly]);

  if (!isOpen) return null;

  const handleToggleExcel = (sourceName: string) => {
    setSelectedExcelSources((prev) =>
      prev.includes(sourceName) ? prev.filter((s) => s !== sourceName) : [...prev, sourceName]
    );
  };

  const handleSelectAllExcels = () => {
    if (selectedExcelSources.length === excelBatches.length) {
      setSelectedExcelSources([]);
    } else {
      setSelectedExcelSources(excelBatches.map((b) => b.sourceName));
    }
  };

  const handleEraseSingleExcel = async (sourceName: string) => {
    const batch = excelBatches.find((b) => b.sourceName === sourceName);
    const label = batch ? batch.displayName : sourceName;
    if (
      !window.confirm(
        `Are you sure you want to erase "${label}"?\n\n✔ Only contacts from this specific Excel spreadsheet will be removed.\n✔ Callers cannot and will not be deleted (${callers.length} callers remain 100% constant).`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onExecuteErase({
        excelSources: [sourceName],
        unassignedOnly,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to erase Excel data');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    let sourcesToErase: string[] = [];

    if (eraseMode === 'all_excels') {
      sourcesToErase = excelBatches.map((b) => b.sourceName);
    } else if (eraseMode === 'excel_selection') {
      if (selectedExcelSources.length === 0) {
        setErrorMessage('Please select at least one Excel spreadsheet to erase.');
        return;
      }
      sourcesToErase = selectedExcelSources;
    }

    setIsDeleting(true);
    try {
      await onExecuteErase({
        excelSources: sourcesToErase,
        unassignedOnly: eraseMode !== 'custom_components' ? unassignedOnly : false,
        clearAssignments: eraseMode === 'custom_components' ? clearAssignments : false,
        clearCallLogs: eraseMode === 'custom_components' ? clearCallLogs : false,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to execute erase operation');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#1e1b4b]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#fbf7fe] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#e2d0fa] my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#e2d0fa]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fff1f2] border border-[#fecdd3] flex items-center justify-center text-[#ff2a85] shrink-0 shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1e1b4b]">
                Selective Data Eraser & Excel Wipe Manager
              </h2>
              <p className="text-xs text-[#7c7896] font-medium mt-0.5">
                Confirm what you want to remove. Callers are permanent and protected from deletion.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#7c7896] hover:text-[#1e1b4b] hover:bg-[#f3efff] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto pr-1 py-4 space-y-5 flex-1 text-xs">
          {/* 1. CALLER CONSTANCY GUARANTEE (LOCKED & IMMUNE) */}
          <div className="bg-[#f2e7fe] border border-[#d8bbfb] rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#6c28f5] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-black text-[#1e1b4b] text-xs sm:text-sm flex items-center gap-1.5">
                  <span>Permanent Callers Fleet: Protected &amp; Undeletable</span>
                  <span className="px-2 py-0.5 bg-[#88d600] text-[#1e1b4b] text-[10px] font-black rounded-md inline-flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Immune
                  </span>
                </span>
                <span className="text-[11px] font-bold text-[#6c28f5] bg-white/70 px-2 py-0.5 rounded-lg border border-[#e2d0fa]">
                  {callers.length} Callers Registered
                </span>
              </div>
              <p className="text-[#645f82] font-medium leading-relaxed">
                By system policy, callers can only be added or edited—they <strong>cannot be deleted</strong>.
                All caller profiles, WhatsApp phone numbers, and targets remain 100% constant and untouched throughout this erase operation.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3.5 bg-[#fff1f2] text-[#ff2a85] rounded-2xl border border-[#fecdd3] font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 2. MODE SELECTOR */}
          <div>
            <label className="block font-bold text-[#1e1b4b] mb-2">
              Select What You Want To Remove:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEraseMode('excel_selection')}
                className={`p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  eraseMode === 'excel_selection'
                    ? 'border-[#6c28f5] bg-[#f3efff] text-[#6c28f5] shadow-xs ring-1 ring-[#6c28f5]'
                    : 'border-[#e2d0fa] bg-white text-[#7c7896] hover:bg-[#faf5ff]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-[#6c28f5] font-extrabold">
                    Recommended
                  </span>
                </div>
                <div>
                  <span className="block text-xs text-[#1e1b4b]">Select Specific Excels</span>
                  <span className="text-[11px] font-medium text-[#7c7896]">
                    Choose Excel 1, Excel 2, etc.
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEraseMode('all_excels')}
                className={`p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  eraseMode === 'all_excels'
                    ? 'border-[#ff2a85] bg-[#fff1f2] text-[#ff2a85] shadow-xs ring-1 ring-[#ff2a85]'
                    : 'border-[#e2d0fa] bg-white text-[#7c7896] hover:bg-[#faf5ff]'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <div>
                  <span className="block text-xs text-[#1e1b4b]">All Uploaded Excels</span>
                  <span className="text-[11px] font-medium text-[#7c7896]">
                    Wipe all contact lists
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEraseMode('custom_components')}
                className={`p-3 rounded-2xl border text-left font-bold transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  eraseMode === 'custom_components'
                    ? 'border-[#ffb800] bg-[#fffbeb] text-[#b47800] shadow-xs ring-1 ring-[#ffb800]'
                    : 'border-[#e2d0fa] bg-white text-[#7c7896] hover:bg-[#faf5ff]'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <div>
                  <span className="block text-xs text-[#1e1b4b]">Custom Components</span>
                  <span className="text-[11px] font-medium text-[#7c7896]">
                    Assignments / logs only
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 3. LAY OUT THE EXCELS (When in excel_selection mode or all_excels mode) */}
          {(eraseMode === 'excel_selection' || eraseMode === 'all_excels') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-[#1e1b4b] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-[#6c28f5]" />
                    <span>Uploaded Excel Spreadsheets in Database ({excelBatches.length})</span>
                  </h3>
                  <span className="text-[11px] text-[#7c7896]">
                    {eraseMode === 'excel_selection'
                      ? 'Tick the checkbox next to the specific Excel sheet you wish to erase:'
                      : 'All of the following Excel sheets will be wiped from contacts:'}
                  </span>
                </div>

                {eraseMode === 'excel_selection' && excelBatches.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSelectAllExcels}
                    className="text-[11px] font-bold text-[#6c28f5] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {selectedExcelSources.length === excelBatches.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {excelBatches.length === 0 ? (
                <div className="p-6 text-center bg-white rounded-2xl border border-dashed border-[#e2d0fa] text-[#7c7896]">
                  No Excel spreadsheets currently imported in the database.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {excelBatches.map((batch, index) => {
                    const isSelected =
                      eraseMode === 'all_excels' || selectedExcelSources.includes(batch.sourceName);

                    return (
                      <div
                        key={batch.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-[#fff5f8] border-[#fecdd3] shadow-xs'
                            : 'bg-white border-[#e2d0fa] hover:border-[#cbaff8]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {eraseMode === 'excel_selection' && (
                              <button
                                type="button"
                                onClick={() => handleToggleExcel(batch.sourceName)}
                                className="mt-0.5 text-[#6c28f5] cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-[#ff2a85]" />
                                ) : (
                                  <Square className="w-4 h-4 text-[#7c7896]" />
                                )}
                              </button>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-[#1e1b4b] text-xs truncate">
                                  {batch.displayName}
                                </span>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#f3efff] text-[#6c28f5] border border-[#e2d0fa]">
                                  {batch.totalContacts} contacts
                                </span>
                                {batch.sheets && batch.sheets.length > 1 && (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-200">
                                    {batch.sheets.length} sheets
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#7c7896] flex-wrap">
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffb800]" />
                                  Unassigned: <strong>{batch.unassignedCount}</strong>
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#6c28f5]" />
                                  Assigned: <strong>{batch.assignedCount}</strong>
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#88d600]" />
                                  Completed: <strong>{batch.completedCount}</strong>
                                </span>
                              </div>

                              {batch.sheets && batch.sheets.length > 1 && (
                                <div className="mt-1 text-[10.5px] text-[#6c28f5] font-medium truncate">
                                  Sheets: {batch.sheets.join(', ')}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quick one-click erase button for this specific Excel */}
                          {eraseMode === 'excel_selection' && (
                            <button
                              type="button"
                              onClick={() => handleEraseSingleExcel(batch.sourceName)}
                              disabled={isDeleting}
                              className="px-2.5 py-1 text-[11px] font-bold text-[#ff2a85] hover:bg-[#fff1f2] border border-[#fecdd3] rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0"
                              title={`Erase only ${batch.displayName}`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Erase This Excel</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Specific Filter: Unassigned Only Checkbox */}
              <div className="p-3 bg-white rounded-2xl border border-[#e2d0fa] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#1e1b4b] block">Only erase unassigned contacts</span>
                  <span className="text-[11px] text-[#7c7896]">
                    Preserves contacts that are already assigned or completed in today&apos;s shift.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={unassignedOnly}
                  onChange={(e) => setUnassignedOnly(e.target.checked)}
                  className="w-4 h-4 text-[#6c28f5] rounded border-[#e2d0fa] cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 4. CUSTOM COMPONENTS MODE */}
          {eraseMode === 'custom_components' && (
            <div className="space-y-3">
              <h3 className="font-black text-[#1e1b4b] text-xs uppercase tracking-wider">
                Select Model Items To Clear:
              </h3>

              <div className="space-y-2">
                <label className="p-3.5 bg-white rounded-2xl border border-[#e2d0fa] flex items-start gap-3 cursor-pointer hover:border-[#6c28f5]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={clearAssignments}
                    onChange={(e) => setClearAssignments(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#6c28f5] rounded border-[#e2d0fa]"
                  />
                  <div>
                    <strong className="block text-[#1e1b4b]">
                      Clear Active Assignments ({assignments.length} assignments)
                    </strong>
                    <span className="text-[#7c7896] text-[11px]">
                      Resets assignments and returns contacts to the unassigned pool. Does NOT delete contact phone numbers.
                    </span>
                  </div>
                </label>

                <label className="p-3.5 bg-white rounded-2xl border border-[#e2d0fa] flex items-start gap-3 cursor-pointer hover:border-[#6c28f5]/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={clearCallLogs}
                    onChange={(e) => setClearCallLogs(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#6c28f5] rounded border-[#e2d0fa]"
                  />
                  <div>
                    <strong className="block text-[#1e1b4b]">Clear Call Attempt History &amp; Outcome Logs</strong>
                    <span className="text-[#7c7896] text-[11px]">
                      Wipes call outcome records (e.g. &ldquo;Available&rdquo;, &ldquo;Phone Off&rdquo;) for a fresh session.
                    </span>
                  </div>
                </label>

                {/* VISUAL LOCK FOR CALLERS: Always uncheckable */}
                <div className="p-3.5 bg-[#f8f2fe] rounded-2xl border border-[#d8bbfb] flex items-start gap-3 opacity-80 cursor-not-allowed">
                  <input
                    type="checkbox"
                    checked={false}
                    disabled
                    className="mt-0.5 w-4 h-4 text-[#7c7896] rounded border-[#e2d0fa]"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-[#1e1b4b]">Permanent Callers Fleet ({callers.length} callers)</strong>
                      <span className="px-2 py-0.2 rounded-md bg-[#6c28f5] text-white text-[10px] font-black inline-flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Undeletable
                      </span>
                    </div>
                    <span className="text-[#645f82] text-[11px]">
                      Callers cannot be deleted under any circumstances. They remain constant.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. SUMMARY OF PLANNED ACTIONS */}
          <div className="p-3.5 bg-[#fbf7fe] rounded-2xl border border-[#e2d0fa] space-y-1.5">
            <div className="flex items-center gap-1.5 font-black text-[#1e1b4b]">
              <Info className="w-4 h-4 text-[#6c28f5]" />
              <span>Summary of Confirmation:</span>
            </div>
            <ul className="list-disc list-inside text-[11px] text-[#7c7896] space-y-0.5">
              <li>
                <strong>Contacts to erase:</strong>{' '}
                <span className="text-[#ff2a85] font-bold">
                  {eraseMode === 'custom_components' ? '0 (Preserved)' : `${selectedContactCount} contacts`}
                </span>
                {eraseMode === 'excel_selection' && selectedExcelSources.length > 0 && (
                  <span> from {selectedExcelSources.length} selected Excel sheet(s)</span>
                )}
              </li>
              <li>
                <strong>Callers fleet:</strong>{' '}
                <span className="text-[#558800] font-bold">
                  All {callers.length} callers remain 100% constant, preserved, and abiding.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-4 border-t border-[#e2d0fa] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-[#7c7896] hover:bg-[#f3efff] rounded-xl font-bold transition-colors cursor-pointer text-xs"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isDeleting ||
              isSyncing ||
              (eraseMode === 'excel_selection' && selectedExcelSources.length === 0) ||
              (eraseMode === 'custom_components' && !clearAssignments && !clearCallLogs)
            }
            className="px-5 py-2.5 bg-[#ff2a85] hover:bg-[#e01a70] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all shadow-md shadow-pink-600/20 cursor-pointer flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Erasing Selected Data...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>
                  {eraseMode === 'excel_selection'
                    ? `Erase Selected (${selectedContactCount} Contacts)`
                    : eraseMode === 'all_excels'
                    ? `Erase All Excel Contacts (${contacts.length})`
                    : 'Execute Component Erase'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
