import React, { useState, useRef } from 'react';
import { Contact } from '../types';
import {
  parseContactExcel,
  downloadExcelTemplate,
  ParseExcelResult,
  normalizePhoneNumber,
} from '../services/excelService';
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
} from 'lucide-react';

interface ContactsViewProps {
  contacts: Contact[];
  onImportContacts: (contacts: Omit<Contact, 'id' | 'createdAt' | 'status'>[]) => Promise<void>;
  onDeleteContact?: (contactId: string) => Promise<void>;
  onRefresh: () => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  onImportContacts,
  onDeleteContact,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

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
  const [previewTab, setPreviewTab] = useState<'valid' | 'invalid' | 'duplicates'>('valid');
  const [isSubmittingImport, setIsSubmittingImport] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

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
      setImportSuccessMsg(`Successfully imported ${parseResult.valid.length} valid contacts!`);
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
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || c.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Excel Upload & Management Hero Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Contact Import Module (Excel / .xlsx, .xls)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload spreadsheets, validate columns, normalize phone numbers, and filter duplicates.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                resetManualForm();
                setShowAddModal(true);
              }}
              className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Single Contact
            </button>
            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Excel Template
            </button>
          </div>
        </div>

        <div className="p-5">
          {importSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {importSuccessMsg}
              </div>
              <button
                type="button"
                onClick={() => setImportSuccessMsg(null)}
                className="text-xs text-emerald-700 hover:text-emerald-900"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-6 text-center cursor-pointer bg-slate-50/60 hover:bg-emerald-50/20 transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 mb-3">
              {isParsing ? (
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {isParsing ? 'Validating Excel Sheet...' : 'Click to Upload Excel Contact List'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports .xlsx and .xls formats (Columns: Name, Phone Number, Location, Category, Notes)
            </p>
          </div>

          {/* Import Preview Modal / Container if parsed */}
          {parseResult && (
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Import Validation Summary
                  </h3>
                  <p className="text-xs text-slate-500">
                    Total rows processed: {parseResult.totalRows}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setParseResult(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={parseResult.valid.length === 0 || isSubmittingImport}
                    onClick={handleConfirmImport}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    {isSubmittingImport
                      ? 'Saving to Database...'
                      : `Confirm & Save ${parseResult.valid.length} Valid Contacts`}
                  </button>
                </div>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center gap-2 my-3">
                <button
                  type="button"
                  onClick={() => setPreviewTab('valid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    previewTab === 'valid'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Valid ({parseResult.valid.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('invalid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    previewTab === 'invalid'
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Invalid ({parseResult.invalid.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('duplicates')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    previewTab === 'duplicates'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Duplicates ({parseResult.duplicates.length})
                </button>
              </div>

              {/* Preview Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto max-h-60">
                {previewTab === 'valid' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Original Phone</th>
                        <th className="p-2.5">Normalized Phone</th>
                        <th className="p-2.5">Location</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.valid.map((c, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-slate-900">{c.name}</td>
                          <td className="p-2.5 font-mono text-slate-600">{c.phone}</td>
                          <td className="p-2.5 font-mono text-emerald-700 font-medium">
                            {c.normalizedPhone}
                          </td>
                          <td className="p-2.5 text-slate-600">{c.location}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                              {c.category}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-500 truncate max-w-xs">{c.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {previewTab === 'invalid' && (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-red-50 border-b border-red-100 text-red-700 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5">Row #</th>
                        <th className="p-2.5">Reason</th>
                        <th className="p-2.5">Raw Data Sample</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-red-100">
                      {parseResult.invalid.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400">
                            No invalid rows detected!
                          </td>
                        </tr>
                      ) : (
                        parseResult.invalid.map((item, i) => (
                          <tr key={i} className="hover:bg-red-50/50">
                            <td className="p-2.5 font-semibold text-slate-700">Row {item.row}</td>
                            <td className="p-2.5 font-semibold text-red-600">{item.reason}</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-600">
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
                    <thead className="bg-amber-50 border-b border-amber-100 text-amber-800 uppercase font-semibold">
                      <tr>
                        <th className="p-2.5">Row #</th>
                        <th className="p-2.5">Issue</th>
                        <th className="p-2.5">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-100">
                      {parseResult.duplicates.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400">
                            No duplicates detected.
                          </td>
                        </tr>
                      ) : (
                        parseResult.duplicates.map((item, i) => (
                          <tr key={i} className="hover:bg-amber-50/50">
                            <td className="p-2.5 font-semibold text-slate-700">Row {item.row}</td>
                            <td className="p-2.5 font-semibold text-amber-700">{item.reason}</td>
                            <td className="p-2.5 font-mono text-[11px] text-slate-600">
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
        </div>
      </div>

      {/* Existing Contacts Database Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">Database Contacts</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
              {filteredContacts.length} of {contacts.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, location..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 w-48 sm:w-60"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                aria-label="Filter by Category"
                className="bg-transparent outline-none cursor-pointer text-slate-700 font-medium"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by Status"
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none cursor-pointer text-slate-700 font-medium"
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
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
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
            <tbody className="divide-y divide-slate-100">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={onDeleteContact ? 9 : 8} className="p-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <UserPlus className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">No Contacts in Database</p>
                      <p className="text-xs text-slate-500">
                        The contacts database is completely empty. Upload your Excel contact roster or add individual contacts to begin.
                      </p>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            resetManualForm();
                            setShowAddModal(true);
                          }}
                          className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Add First Contact
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload Excel (.xlsx)
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact, index) => {
                  const statusColors: Record<string, string> = {
                    unassigned: 'bg-blue-50 text-blue-700 border-blue-200',
                    assigned: 'bg-amber-50 text-amber-700 border-amber-200',
                    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    pending: 'bg-purple-50 text-purple-700 border-purple-200',
                  };
                  return (
                    <tr key={contact.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="p-3 text-slate-400 font-mono">{index + 1}</td>
                      <td className="p-3 font-semibold text-slate-900">{contact.name}</td>
                      <td className="p-3 font-mono text-slate-700 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {contact.normalizedPhone || contact.phone}
                      </td>
                      <td className="p-3 text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {contact.location || 'Unspecified'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium inline-flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          {contact.category || 'General'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 max-w-xs truncate" title={contact.notes}>
                        {contact.notes || '-'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            statusColors[contact.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {contact.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px] truncate max-w-xs">
                        {contact.source || 'Direct'}
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
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 relative">
            <button
              type="button"
              onClick={resetManualForm}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add New Contact</h3>
                <p className="text-xs text-slate-500">Enter contact details for calling operations</p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {modalError}
              </div>
            )}

            <form onSubmit={handleManualSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. John Mukasa"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="e.g. +256701234567 or 0701234567"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-slate-800 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">Numbers will be normalized to international E.164 format.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location / District</label>
                  <input
                    type="text"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    placeholder="e.g. Kampala"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    placeholder="e.g. General, VIP"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Context, background, preferred calling time..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-slate-800 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetManualForm}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
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
