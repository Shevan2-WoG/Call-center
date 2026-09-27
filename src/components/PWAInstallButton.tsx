import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, Check, X, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'hero' | 'compact';
  onInstalledCallback?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'nav',
  onInstalledCallback,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed and running as standalone app, don't show prompt
  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#88d600]/20 text-[#88d600] text-[11px] font-bold border border-[#88d600]/30 select-none">
        <Check className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Installed on Device</span>
        <span className="sm:hidden">Installed</span>
      </span>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        onInstalledCallback?.();
        setTimeout(() => setInstallSuccess(false), 5000);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* 1. Nav Variant: Fits seamlessly in top navigation */}
      {variant === 'nav' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#ff2a85] to-[#6c28f5] hover:from-[#ff4095] hover:to-[#7c38ff] text-white shadow-md shadow-pink-950/30 transition-all cursor-pointer animate-pulse hover:animate-none"
          title="Install KIU Call Center Hub to your phone's home screen"
        >
          <Smartphone className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Install App</span>
          <span className="sm:hidden">Install</span>
        </button>
      )}

      {/* 2. Hero Variant: Prominent CTA on Homepage */}
      {variant === 'hero' && (
        <div className="bg-gradient-to-r from-[#240c54] via-[#37127e] to-[#1e0a44] p-5 sm:p-6 rounded-3xl border-2 border-[#ff2a85]/50 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#ff2a85]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-[#88d600]/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6c28f5] to-[#ff2a85] p-0.5 shadow-lg shadow-purple-950/50 shrink-0 flex items-center justify-center">
                <div className="w-full h-full bg-[#1b0840] rounded-[14px] flex items-center justify-center">
                  <Smartphone className="w-7 h-7 text-[#88d600]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Install on Your Phone
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ff2a85] text-white">
                    App Download
                  </span>
                </div>
                <p className="text-xs text-purple-200/90 font-medium mt-0.5 max-w-xl">
                  Add KIU Hub directly to your phone screen! Open with 1 tap, dial contacts quickly, and work without browser bars.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#ff2a85] hover:bg-[#ff3b91] text-white text-xs sm:text-sm font-black shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{isInstallable ? 'Install App on Phone' : 'How to Install on Phone'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Compact Variant */}
      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1b0840] hover:bg-[#240c54] text-[#88d600] border border-[#88d600]/40 transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install to Home Screen</span>
        </button>
      )}

      {/* Modal / Installation Guide Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#1b0840] text-white rounded-3xl border-2 border-purple-400/40 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#88d600] via-[#ff2a85] to-[#6c28f5]" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#6c28f5] flex items-center justify-center text-white">
                  <Smartphone className="w-5 h-5 text-[#88d600]" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">Install KIU Hub on Your Phone</h4>
                  <p className="text-[11px] text-purple-200/80">Keep it on your phone's desktop/home screen</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-purple-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If direct browser install button is available */}
            {isInstallable ? (
              <div className="mb-4">
                <p className="text-xs text-purple-200 mb-3">
                  Your browser supports direct installation. Click the button below to download and install KIU Hub immediately:
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await install();
                    if (ok) {
                      setShowModal(false);
                      setInstallSuccess(true);
                      setTimeout(() => setInstallSuccess(false), 5000);
                    }
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#88d600] hover:bg-[#9bf000] text-[#1e1b4b] font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-lime-950/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download & Install Now</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {isIOS ? (
                  /* iOS / iPhone Guide */
                  <div className="space-y-3 bg-[#240c54] p-4 rounded-2xl border border-purple-400/20">
                    <div className="text-xs font-bold text-[#88d600] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>For iPhone & iPad (Safari):</span>
                    </div>

                    <div className="space-y-2.5 text-xs text-purple-100">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#6c28f5] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          1
                        </span>
                        <p>
                          Tap the <strong className="text-white">Share</strong> button{' '}
                          <Share className="w-3.5 h-3.5 inline mx-1 text-purple-300" /> at the bottom or top of Safari.
                        </p>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#6c28f5] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          2
                        </span>
                        <p>
                          Scroll down the list and tap <strong className="text-white">Add to Home Screen</strong>{' '}
                          <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-[#88d600]" />.
                        </p>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#6c28f5] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          3
                        </span>
                        <p>
                          Tap <strong className="text-[#88d600]">Add</strong> in the top-right corner. The KIU Hub icon will appear on your phone screen!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Android / Chrome / General Guide */
                  <div className="space-y-3 bg-[#240c54] p-4 rounded-2xl border border-purple-400/20">
                    <div className="text-xs font-bold text-[#88d600] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>For Android & Chrome:</span>
                    </div>

                    <div className="space-y-2.5 text-xs text-purple-100">
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#ff2a85] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          1
                        </span>
                        <p>
                          Tap the <strong className="text-white">three dots menu (⋮)</strong> in the top-right corner of your browser.
                        </p>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#ff2a85] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          2
                        </span>
                        <p>
                          Select <strong className="text-[#88d600]">Install App</strong> or <strong className="text-white">Add to Home Screen</strong>.
                        </p>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#ff2a85] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          3
                        </span>
                        <p>
                          Confirm by tapping <strong className="text-[#88d600]">Install</strong>. The app icon will be placed directly on your phone's home screen!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* In-app browser tip (e.g. WhatsApp, Facebook, Telegram) */}
                <div className="p-3 rounded-xl bg-purple-900/40 border border-purple-400/20 text-[11px] text-purple-200">
                  <strong className="text-white">Opened from WhatsApp?</strong> Tap the 3 dots (⋮) or Share icon and select <strong>"Open in Chrome"</strong> or <strong>"Open in Safari"</strong> to install.
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {installSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#88d600] text-[#1e1b4b] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black animate-bounce">
          <Check className="w-4 h-4" />
          <span>KIU Hub successfully installed to your home screen!</span>
        </div>
      )}
    </>
  );
};
