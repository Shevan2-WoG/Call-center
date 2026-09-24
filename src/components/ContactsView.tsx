import React, { useState, useRef, useMemo } from 'react';
import { Contact, ExcelUploadBatch } from '../types';
import {
  parseContactExcel,
  downloadExcelTemplate,
  downloadMultiSheetExcelDemo,
  ParseExcelResult,
  normalizePhoneNumber,
} from '../services/excelService';
import { getExcelUploadBatches } from '../services/dbService';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  Check,
  RefreshCw,
  Phone,
  MapPin,
  Tag,
  UserPlus,
  Trash2,
  X,
  ShieldCheck,
  Lock,
  Layers,
} from 'lucide-react';

interface ContactsViewProps {
  contacts: Contact[];
  onImportContacts: (contacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[]) => Promise<void>;
  onDeleteContact?: (contactId: string) => Promise<void>;
  onClearAllContacts?: () => Promise<void>;
  onOpenEraseModal?: () => void;
  onEraseSpecificExcel?: (sourceName: string) => Promise<void>;
  onRefresh: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  onImportContacts,
  onDeleteContact,
  onClearAllContacts,
  onOpenEraseModal,
  onEraseSpecificExcel,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [filterSheet, setFilterSheet] = useState('all');

  // Compute Excel batches
  const excelBatches = useMemo(() => {
    return getExcelUploadBatches(contacts);
  }, [contacts]);

  // Compute available sheets from contacts
  const availableSheets = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.sheetName && c.sheetName.trim()) {
        set.add(c.sheetName.trim());
      }
    });
    return Array.from(set);
  }, [contacts]);

  // Manual single contact modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualCategory, setManualCategory] = useState('General');
  const [manualNotes, setManualNotes] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // Import flow state
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseExcelResult | null>(null);
  const [selectedPreviewSheet, setSelectedPreviewSheet] = useState<string>('all');
  const [previewTab, setPreviewTab] = useState<'valid' | 'invalid' | 'duplicates'>('valid');
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Compute filtered valid contacts in preview by sheet
  const displayedValidContacts = useMemo(() => {
    if (!parseResult) return [];
    if (selectedPreviewSheet === 'all') return parseResult.valid;
    return parseResult.valid.filter((c) => c.sheetName === selectedPreviewSheet);
  }, [parseResult, selectedPreviewSheet]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetManualForm = () => {
    setManualName('');
    setManualPhone('');
    setManualLocation('');
    setManualCategory('General');
    setManualNotes('');
    setModalError(null);
    setShowAddModal(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) {
      setModalError('Contact Name is required');
      return;
    }
    const norm = normalizePhoneNumber(manualPhone);
    if (!norm.isValid) {
      setModalError(`Invalid phone number: ${norm.error}`);
      return;
    }

    setIsSavingManual(true);
    try {
      await onImportContacts([
        {
          name: manualName.trim(),
          phone: manualPhone.trim(),
          normalizedPhone: norm.normalized,
          location: manualLocation.trim() || undefined,
          category: manualCategory.trim() || 'General',
          notes: manualNotes.trim() || undefined,
          source: 'Manual Entry',
        },
      ]);
      setImportSuccessMsg(`Contact "${manualName.trim()}" added successfully!`);
      resetManualForm();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save contact');
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setImportSuccessMsg(null);

    try {
      const existingPhones = new Set<string>(contacts.map((c) => c.normalizedPhone || c.phone));
      const res = await parseContactExcel(file, existingPhones);
      setParseResult(res);
      setSelectedPreviewSheet('all');
      setPreviewTab(res.valid.length > 0 ? 'valid' : res.invalid.length > 0 ? 'invalid' : 'duplicates');
    } catch (err: any) {
      alert(`Error reading Excel file: ${err.message || 'Corrupted file'}`);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.valid.length === 0) return;
    setIsSubmittingImport(true);
    try {
      await onImportContacts(parseResult.valid);
      setImportSuccessMsg(
        `Successfully imported ${parseResult.valid.length} contacts from ${
          parseResult.sheetSummaries.length > 1 ? `${parseResult.sheetSummaries.length} sheets` : 'sheet'
        }!`
      );
      setParseResult(null);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsSubmittingImport(false);
    }
  };

  // Filter contacts
  const categories = Array.from(new Set(contacts.map((c) => c.category || 'General')));
  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.location && c.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.sheetName && c.sheetName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSource =
      filterSource === 'all' ||
      (c.source || 'Excel 1 (Initial Import)').trim().toLowerCase() === filterSource.trim().toLowerCase();
    const matchesSheet =
      filterSheet === 'all' ||
      (c.sheetName || '').trim().toLowerCase() === filterSheet.trim().toLowerCase();
    return matchesSearch && matchesCategory && matchesStatus && matchesSource && matchesSheet;
  });

  const handleEraseBatch = async (sourceName: string, displayName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to erase "${displayName}"?\n\n✔ Only contacts from this specific Excel spreadsheet will be removed.\n✔ Caller profiles and team rosters remain protected and preserved.`
      )
    ) {
      return;
    }

    if (onEraseSpecificExcel) {
      await onEraseSpecificExcel(sourceName);
    } else if (onOpenEraseModal) {
      onOpenEraseModal();
    }
  };

  return (
    <div className="space-y-6">
      {/* Excel Upload & Management Hero Card */}
      <div className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#e2d0fa] bg-[#f3e8fd] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#1e1b4b] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#6c28f5]" />
              Contact Import Module (Excel / .xlsx, .xls)
            </h2>
            <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
              Upload spreadsheets, validate columns, normalize phone numbers, and filter duplicates.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {onOpenEraseModal && (
              <button
                type="button"
                onClick={onOpenEraseModal}
                className="px-3.5 py-2 rounded-xl bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#ff2a85] border border-[#fecdd3] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Selectively erase specific uploaded Excels or clear components"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#ff2a85]" />
                <span>Selective Erase</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                resetManualForm();
                setShowAddModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#6c28f5] hover:bg-[#5816d6] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Single Contact
            </button>
            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="px-3.5 py-2 rounded-xl border border-[#e2d0fa] bg-[#f8f2fe] hover:bg-[#f3e9fd] text-[#1e1b4b] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#6c28f5]" />
              Excel Template
            </button>
            <button
              type="button"
              onClick={downloadMultiSheetExcelDemo}
              className="px-3.5 py-2 rounded-xl border border-[#cbaff8] bg-white hover:bg-[#f5eaff] text-[#6c28f5] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Download sample Excel with 7 separate sheets to test multi-sheet importing"
            >
              <Layers className="w-3.5 h-3.5 text-[#6c28f5]" />
              Sample 7-Sheet Excel
            </button>
          </div>
        </div>

        <div className="p-5">
          {importSuccessMsg && (
            <div className="mb-4 p-3.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#15803d]">
                <CheckCircle className="w-4 h-4 text-[#88d600]" />
                {importSuccessMsg}
              </div>
              <button
                type="button"
                onClick={() => setImportSuccessMsg(null)}
                className="text-xs text-[#15803d] hover:underline font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#cbaff8] hover:border-[#6c28f5] rounded-3xl p-7 text-center cursor-pointer bg-[#f8f2fe] hover:bg-[#f1e4fc] transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#f3efff] flex items-center justify-center text-[#6c28f5] mb-3 group-hover:scale-105 transition-transform shadow-xs">
              {isParsing ? (
                <RefreshCw className="w-7 h-7 animate-spin text-[#6c28f5]" />
              ) : (
                <Upload className="w-7 h-7" />
              )}
            </div>
            <p className="text-sm font-black text-[#1e1b4b]">
              {isParsing ? 'Intelligently Processing Excel...' : 'Click to Upload Any Excel Contact Roster'}
            </p>
            <p className="text-xs text-[#7c7896] mt-1 max-w-xl mx-auto font-medium leading-relaxed">
              Universal Excel Parser: Accepts any spreadsheet layout, column names, headerless rows, or phone formats (local, international, with dashes or spaces) with auto-normalization. Reads and aggregates <strong>all sheets</strong> in the workbook automatically.
            </p>
          </div>

          {/* Import Preview Modal / Container if parsed */}
          {parseResult && (
            <div className="mt-6 bg-[#f8f2fe] border border-[#e2d0fa] rounded-3xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e2d0fa]">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-[#1e1b4b]">
                      Excel Import Ready
                    </h3>
                    {parseResult.sheetSummaries.length > 1 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6c28f5]/15 text-[#6c28f5] flex items-center gap-1 border border-[#cbaff8]">
                        <Layers className="w-3.5 h-3.5 text-[#6c28f5]" />
                        {parseResult.sheetSummaries.length} Sheets Read
                      </span>
                    )}
                    {parseResult.invalid.length === 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#88d600]/15 text-[#629c00] flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-[#88d600]" />
                        100% Parsed Successfully
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7c7896] mt-0.5 font-medium">
                    Found {parseResult.valid.length} valid contacts across {parseResult.sheetSummaries.length}{' '}
                    {parseResult.sheetSummaries.length > 1 ? 'sheets' : 'sheet'} ({parseResult.totalRows} sheet rows).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setParseResult(null)}
                    className="px-3.5 py-1.5 text-xs text-[#7c7896] hover:text-[#1e1b4b] rounded-xl transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={parseResult.valid.length === 0 || isSubmittingImport}
                    onClick={handleConfirmImport}
                    className="px-4 py-2 bg-[#6c28f5] hover:bg-[#5816d6] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer transition-all"
                  >
                    <Check className="w-4 h-4" />
                    {isSubmittingImport
                      ? 'Saving to Database...'
                      : `Confirm & Import ${parseResult.valid.length} Contacts`}
                  </button>
                </div>
              </div>

              {/* Multi-Sheet Detection & Sheet Selector Filter */}
              {parseResult.sheetSummaries.length > 1 && (
                <div className="my-3 p-3 bg-white rounded-2xl border border-[#cbaff8] shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-lg bg-[#6c28f5]/10 text-[#6c28f5]">
                        <Layers className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-xs font-black text-[#1e1b4b]">
                        All {parseResult.sheetSummaries.length} Sheets Read in this Excel:
                      </span>
                    </div>
                    <span className="text-[11px] text-[#7c7896] font-medium">
                      Showing {displayedValidContacts.length} of {parseResult.valid.length} ready contacts
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewSheet('all')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                        selectedPreviewSheet === 'all'
                          ? 'bg-[#6c28f5] text-white shadow-xs'
                          : 'bg-[#f8f2fe] text-[#7c7896] hover:text-[#1e1b4b] border border-[#e2d0fa]'
                      }`}
                    >
                      All Sheets ({parseResult.valid.length})
                    </button>
                    {parseResult.sheetSummaries.map((s) => (
                      <button
                        key={s.sheetName}
                        type="button"
                        onClick={() => setSelectedPreviewSheet(s.sheetName)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                          selectedPreviewSheet === s.sheetName
                            ? 'bg-[#6c28f5] text-white shadow-xs'
                            : 'bg-[#f8f2fe] text-[#7c7896] hover:text-[#1e1b4b] border border-[#e2d0fa]'
                        }`}
                      >
                        <span>{s.sheetName}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            selectedPreviewSheet === s.sheetName
                              ? 'bg-white/25 text-white'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {s.validCount}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Tabs */}
              <div className="flex items-center gap-2 my-3">
                <button
                  type="button"
                  onClick={() => setPreviewTab('valid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    previewTab === 'valid'
                      ? 'bg-[#6c28f5] text-white shadow-xs'
                      : 'bg-[#f8f2fe] text-[#1e1b4b] border border-[#e2d0fa] hover:bg-[#efe0fc]'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Ready to Import ({displayedValidContacts.length}
                  {selectedPreviewSheet !== 'all' ? ` in ${selectedPreviewSheet}` : ''})
                </button>

                {parseResult.duplicates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewTab('duplicates')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      previewTab === 'duplicates'
                        ? 'bg-[#ffb800] text-white shadow-xs'
                        : 'bg-[#f8f2fe] text-[#1e1b4b] border border-[#e2d0fa] hover:bg-[#efe0fc]'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Deduplicated ({parseResult.duplicates.length})
                  </button>
                )}

                {parseResult.invalid.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewTab('invalid')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      previewTab === 'invalid'
                        ? 'bg-[#ff2a85] text-white shadow-xs'
                        : 'bg-[#f8f2fe] text-[#1e1b4b] border border-[#e2d0fa] hover:bg-[#efe0fc]'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Invalid ({parseResult.invalid.length})
                  </button>
                )}
              </div>

              {/* Preview Table */}
              <div className="bg-[#fbf7fe] rounded-2xl border border-[#e2d0fa] overflow-x-auto max-h-60">
                {previewTab === 'valid' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8f2fe] border-b border-[#e2d0fa] text-[#7c7896] uppercase font-bold text-[11px]">
                      <tr>
                        {parseResult.sheetSummaries.length > 1 && <th className="p-3">Sheet</th>}
                        <th className="p-3">Name</th>
                        <th className="p-3">Original Phone</th>
                        <th className="p-3">Normalized Phone</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2d0fa]">
                      {displayedValidContacts.map((c, i) => (
                        <tr key={i} className="hover:bg-[#f3e9fd]">
                          {parseResult.sheetSummaries.length > 1 && (
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px] border border-purple-200 whitespace-nowrap">
                                {c.sheetName || 'Sheet 1'}
                              </span>
                            </td>
                          )}
                          <td className="p-3 font-bold text-[#1e1b4b]">{c.name}</td>
                          <td className="p-3 font-mono text-[#7c7896]">{c.phone}</td>
                          <td className="p-3 font-mono text-[#6c28f5] font-bold">
                            {c.normalizedPhone}
                          </td>
                          <td className="p-3 text-[#7c7896]">{c.location}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-[#f3efff] text-[#6c28f5] font-bold text-[11px]">
                              {c.category}
                            </span>
                          </td>
                          <td className="p-3 text-[#7c7896] truncate max-w-xs">{c.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {previewTab === 'invalid' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fff1f2] border-b border-[#fecdd3] text-[#be123c] uppercase font-bold text-[11px]">
                      <tr>
                        {parseResult.sheetSummaries.length > 1 && <th className="p-3">Sheet</th>}
                        <th className="p-3">Row #</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3">Raw Data Sample</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ffe4e6]">
                      {parseResult.invalid.length === 0 ? (
                        <tr>
                          <td colSpan={parseResult.sheetSummaries.length > 1 ? 4 : 3} className="p-4 text-center text-[#7c7896]">
                            No invalid rows detected!
                          </td>
                        </tr>
                      ) : (
                        parseResult.invalid.map((item, i) => (
                          <tr key={i} className="hover:bg-[#fff1f2]/50">
                            {parseResult.sheetSummaries.length > 1 && (
                              <td className="p-3 font-bold text-[#6c28f5] text-[11px] whitespace-nowrap">
                                {item.sheetName || 'Sheet 1'}
                              </td>
                            )}
                            <td className="p-3 font-bold text-[#1e1b4b]">Row {item.row}</td>
                            <td className="p-3 font-bold text-[#ff2a85]">{item.reason}</td>
                            <td className="p-3 font-mono text-[11px] text-[#7c7896]">
                              {JSON.stringify(item.data)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {previewTab === 'duplicates' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fffbeb] border-b border-[#fef3c7] text-[#92400e] uppercase font-bold text-[11px]">
                      <tr>
                        {parseResult.sheetSummaries.length > 1 && <th className="p-3">Sheet</th>}
                        <th className="p-3">Row #</th>
                        <th className="p-3">Issue</th>
                        <th className="p-3">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#fef3c7]">
                      {parseResult.duplicates.length === 0 ? (
                        <tr>
                          <td colSpan={parseResult.sheetSummaries.length > 1 ? 4 : 3} className="p-4 text-center text-[#7c7896]">
                            No duplicates detected.
                          </td>
                        </tr>
                      ) : (
                        parseResult.duplicates.map((item, i) => (
                          <tr key={i} className="hover:bg-[#fffbeb]/50">
                            {parseResult.sheetSummaries.length > 1 && (
                              <td className="p-3 font-bold text-[#6c28f5] text-[11px] whitespace-nowrap">
                                {item.sheetName || 'Sheet 1'}
                              </td>
                            )}
                            <td className="p-3 font-bold text-[#1e1b4b]">Row {item.row}</td>
                            <td className="p-3 font-bold text-[#b47800]">{item.reason}</td>
                            <td className="p-3 font-mono text-[11px] text-[#7c7896]">
                              {JSON.stringify(item.data)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Lay out the Excels: Uploaded Spreadsheets Roster */}
          {excelBatches.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#e2d0fa] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-black text-[#1e1b4b] uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-[#6c28f5]" />
                    <span>Uploaded Excel Spreadsheets in Database ({excelBatches.length})</span>
                  </h3>
                  <p className="text-[11px] text-[#7c7896] font-medium mt-0.5">
                    Individual Excel files detected in your database. You can filter the table or selectively erase any single Excel below.
                  </p>
                </div>

                {onOpenEraseModal && (
                  <button
                    type="button"
                    onClick={onOpenEraseModal}
                    className="text-xs font-bold text-[#ff2a85] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Advanced Erase Options</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {excelBatches.map((batch) => (
                  <div
                    key={batch.id}
                    className="p-4 rounded-2xl border border-[#e2d0fa] bg-white hover:border-[#cbaff8] transition-all flex flex-col justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="font-black text-xs text-[#1e1b4b] block truncate" title={batch.displayName}>
                            {batch.displayName}
                          </span>
                          <span className="text-[10px] text-[#7c7896] font-mono block truncate">
                            {batch.sourceName}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#f3efff] text-[#6c28f5] border border-[#e2d0fa] shrink-0">
                          {batch.totalContacts} contacts
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#7c7896] flex-wrap">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ffb800]" />
                          Unassigned: <strong className="text-[#1e1b4b]">{batch.unassignedCount}</strong>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6c28f5]" />
                          Assigned: <strong className="text-[#1e1b4b]">{batch.assignedCount}</strong>
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#88d600]" />
                          Done: <strong className="text-[#1e1b4b]">{batch.completedCount}</strong>
                        </span>
                      </div>

                      {batch.sheets && batch.sheets.length > 1 && (
                        <div className="flex items-center gap-1.5 text-[11px] text-[#6c28f5] font-medium mt-1">
                          <Layers className="w-3 h-3 text-[#6c28f5] shrink-0" />
                          <span className="truncate" title={batch.sheets.join(', ')}>
                            {batch.sheets.length} Sheets: {batch.sheets.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-[#f3e8fd] flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterSource(batch.sourceName);
                          const tableElem = document.getElementById('contacts-database-table');
                          if (tableElem) tableElem.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-[11px] font-bold text-[#6c28f5] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <Filter className="w-3 h-3" />
                        <span>Filter Table</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEraseBatch(batch.sourceName, batch.displayName)}
                        className="px-2.5 py-1 text-[11px] font-bold text-[#ff2a85] hover:bg-[#fff1f2] border border-[#fecdd3] rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                        title={`Erase only contacts from ${batch.displayName}`}
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Erase This Excel</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Existing Contacts Database Table */}
      <div id="contacts-database-table" className="bg-[#fbf7fe] rounded-3xl border border-[#e2d0fa] shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-[#e2d0fa] bg-[#f3e8fd] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-[#1e1b4b]">Database Contacts</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f3efff] text-[#6c28f5] font-bold border border-[#e8e1f9]">
              {filteredContacts.length} of {contacts.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#7c7896]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, location..."
                className="pl-8 pr-3 py-1.5 text-xs bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white w-48 sm:w-60 font-medium text-[#1e1b4b]"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl px-2 py-1.5 text-xs">
              <Filter className="w-3 h-3 text-[#7c7896]" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label="Filter by Category"
                className="bg-transparent outline-none cursor-pointer text-[#1e1b4b] font-semibold"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Excel Source Filter */}
            {excelBatches.length > 0 && (
              <div className="flex items-center gap-1 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl px-2 py-1.5 text-xs">
                <FileSpreadsheet className="w-3 h-3 text-[#6c28f5]" />
                <select
                  value={filterSource}
                  onChange={(e) => setFilterSource(e.target.value)}
                  aria-label="Filter by Excel Spreadsheet"
                  className="bg-transparent outline-none cursor-pointer text-[#1e1b4b] font-semibold max-w-[150px] truncate"
                >
                  <option value="all">All Excels ({excelBatches.length})</option>
                  {excelBatches.map((batch) => (
                    <option key={batch.id} value={batch.sourceName}>
                      {batch.displayName} ({batch.totalContacts})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sheet Filter */}
            {availableSheets.length > 0 && (
              <div className="flex items-center gap-1 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl px-2 py-1.5 text-xs">
                <Layers className="w-3 h-3 text-[#6c28f5]" />
                <select
                  value={filterSheet}
                  onChange={(e) => setFilterSheet(e.target.value)}
                  aria-label="Filter by Sheet"
                  className="bg-transparent outline-none cursor-pointer text-[#1e1b4b] font-semibold max-w-[140px] truncate"
                >
                  <option value="all">All Sheets ({availableSheets.length})</option>
                  {availableSheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by Status"
              className="bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl px-2.5 py-1.5 text-xs outline-none cursor-pointer text-[#1e1b4b] font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="unassigned">Unassigned</option>
              <option value="assigned">Assigned</option>
              <option value="completed">Completed</option>
            </select>

            <button
              type="button"
              onClick={onRefresh}
              title="Refresh database records"
              className="p-1.5 rounded-xl border border-[#e2d0fa] hover:bg-[#f3efff] text-[#6c28f5] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {(onOpenEraseModal || onClearAllContacts) && contacts.length > 0 && (
              <button
                type="button"
                onClick={onOpenEraseModal || onClearAllContacts}
                title="Selectively erase uploaded Excels or clear data. Callers are permanent and protected."
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-300/60 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Selective Erase / Wipe</span>
              </button>
            )}
          </div>
        </div>

        {/* Protection Banner */}
        <div className="bg-[#fcf8ff] px-4 py-2 border-b border-[#e2d0fa]/80 flex items-center justify-between gap-2 text-[11px] text-[#7c7896]">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#88d600] shrink-0" />
            <span>
              <strong>Caller Constancy Guarantee:</strong> Erasing data applies strictly to the Excel contacts. The callers end is 100% kept constant.
            </span>
          </div>
          <span className="hidden sm:inline text-[#6c28f5] font-semibold">
            {contacts.filter((c) => c.status === 'unassigned').length} ready for distribution
          </span>
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#ede0fc] border-b border-[#dfcafa] text-[#4e0fb8] uppercase font-black text-[11px]">
              <tr>
                <th className="p-3">#</th>
                <th className="p-3">Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Location</th>
                <th className="p-3">Category</th>
                <th className="p-3">Notes</th>
                <th className="p-3">Status</th>
                <th className="p-3">Source</th>
                {onDeleteContact && <th className="p-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2d0fa]">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={onDeleteContact ? 9 : 8} className="p-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center mx-auto shadow-xs">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-black text-[#1e1b4b]">No Contacts in Database</p>
                      <p className="text-xs text-[#7c7896] font-medium">
                        The contacts database is completely empty. Upload your Excel contact roster or add individual contacts to begin.
                      </p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            resetManualForm();
                            setShowAddModal(true);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#6c28f5] hover:bg-[#5816d6] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Add First Contact
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-xl border border-[#efe8fc] hover:bg-[#f3efff] text-[#1e1b4b] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#6c28f5]" />
                          Upload Excel (.xlsx)
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact, index) => {
                  const statusColors: Record<string, string> = {
                    unassigned: 'bg-[#ffb800]/15 text-[#b47800] border-[#ffb800]/30',
                    assigned: 'bg-[#6c28f5]/15 text-[#6c28f5] border-[#6c28f5]/30',
                    completed: 'bg-[#88d600]/15 text-[#629c00] border-[#88d600]/30',
                    pending: 'bg-[#ff2a85]/15 text-[#ff2a85] border-[#ff2a85]/30',
                  };
                  return (
                    <tr key={contact.id} className="hover:bg-[#f4eafd] bg-[#fbf7fe] transition-colors">
                      <td className="p-3 text-[#7c7896] font-mono">{index + 1}</td>
                      <td className="p-3 font-bold text-[#1e1b4b]">{contact.name}</td>
                      <td className="p-3 font-mono text-[#6c28f5] font-bold flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#6c28f5]" />
                        {contact.normalizedPhone || contact.phone}
                      </td>
                      <td className="p-3 text-[#7c7896]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#7c7896]" />
                          {contact.location || 'Unspecified'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#f3efff] text-[#6c28f5] text-[11px] font-bold inline-flex items-center gap-1 border border-[#e8e1f9]">
                          <Tag className="w-2.5 h-2.5 text-[#6c28f5]" />
                          {contact.category || 'General'}
                        </span>
                      </td>
                      <td className="p-3 text-[#7c7896] max-w-xs truncate" title={contact.notes}>
                        {contact.notes || '-'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                            statusColors[contact.status] || 'bg-[#f3efff] text-[#6c28f5]'
                          }`}
                        >
                          {contact.status}
                        </span>
                      </td>
                      <td className="p-3 text-[#7c7896] text-[11px] max-w-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{contact.source || 'Direct'}</span>
                          {contact.sheetName && (
                            <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold text-[10px] border border-purple-200 shrink-0">
                              {contact.sheetName}
                            </span>
                          )}
                        </div>
                      </td>
                      {onDeleteContact && (
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete contact "${contact.name}"?`)) {
                                onDeleteContact(contact.id);
                              }
                            }}
                            title="Delete Contact"
                            className="p-1.5 rounded-lg text-[#7c7896] hover:text-[#ff2a85] hover:bg-[#fff1f2] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#1e1b4b]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#fbf7fe] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e2d0fa] relative">
            <button
              type="button"
              onClick={resetManualForm}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-[#7c7896] hover:text-[#1e1b4b] hover:bg-[#f3efff] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-[#f3efff] text-[#6c28f5] flex items-center justify-center shadow-xs">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#1e1b4b]">Add New Contact</h3>
                <p className="text-xs text-[#7c7896] font-medium">Enter contact details for calling operations</p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-[#fff1f2] border border-[#fecdd3] text-[#ff2a85] rounded-2xl text-xs flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1e1b4b] mb-1">
                  Full Name <span className="text-[#ff2a85]">*</span>
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. John Mukasa"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-medium transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1e1b4b] mb-1">
                  Phone Number <span className="text-[#ff2a85]">*</span>
                </label>
                <input
                  type="text"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="e.g. +256701234567 or 0701234567"
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-mono font-medium transition-all"
                />
                <p className="text-[11px] text-[#7c7896] mt-1 font-medium">Numbers will be normalized to international E.164 format.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1e1b4b] mb-1">Location / District</label>
                  <input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="e.g. Kampala"
                    className="w-full px-3.5 py-2.5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-medium transition-all"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1e1b4b] mb-1">Category</label>
                  <input
                    type="text"
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    placeholder="e.g. General, VIP"
                    className="w-full px-3.5 py-2.5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1e1b4b] mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Context, background, preferred calling time..."
                  className="w-full px-3.5 py-2.5 bg-[#f8f2fe] border border-[#e2d0fa] rounded-xl outline-none focus:border-[#6c28f5] focus:bg-white text-[#1e1b4b] resize-none font-medium transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e2d0fa]">
                <button
                  type="button"
                  onClick={resetManualForm}
                  className="px-4 py-2 rounded-xl text-[#7c7896] hover:bg-[#f8f6ff] font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-5 py-2.5 rounded-xl bg-[#6c28f5] hover:bg-[#5816d6] text-white font-bold flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSavingManual ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Contact
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
