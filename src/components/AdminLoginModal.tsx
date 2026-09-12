import React, { useState } from 'react';
import { Lock, X, KeyRound, AlertCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ADMIN_PASSWORD = 'HOD Shivan';

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Case-insensitive trimmed check for "HOD Shivan"
    if (password.trim().toLowerCase() === ADMIN_PASSWORD.toLowerCase()) {
      setPassword('');
      setError('');
      setIsSubmitting(false);
      onSuccess();
    } else {
      setIsSubmitting(false);
      setError('Incorrect administrator password. Access denied.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-md bg-[#1d0a3d] border border-purple-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-purple-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6c28f5] to-[#ff2a85] flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">
              Admin Portal Access
            </h3>
            <p className="text-xs text-purple-200/80 font-medium">
              KIU Manifest Call Center Hub
            </p>
          </div>
        </div>

        <p className="text-xs text-purple-200/90 leading-relaxed mb-5">
          This portal is restricted to authorized operations supervisors and administrators for campaign distribution, contact management, and reporting.
        </p>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/15 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="admin-password-input"
              className="block text-xs font-bold text-purple-200 uppercase tracking-wider mb-2 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#ff2a85]" />
              <span>Enter Admin Password</span>
            </label>

            <div className="relative">
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password..."
                className="w-full bg-[#120426] border border-purple-400/40 focus:border-[#ff2a85] focus:ring-2 focus:ring-[#ff2a85]/30 rounded-2xl px-4 py-3 text-sm text-white placeholder-purple-400/50 outline-none transition-all pr-11 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-xs font-bold text-purple-200 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#6c28f5] to-[#ff2a85] hover:opacity-95 text-white text-xs font-black tracking-wide shadow-lg shadow-purple-900/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Unlock Admin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
