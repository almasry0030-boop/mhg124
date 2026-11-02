import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, PlusSquare, X, Sparkles, Smartphone } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  // If already running standalone or user dismissed this session, don't show
  if (isInstalled || isDismissed) {
    return null;
  }

  // Handle standard Android / Chromium install
  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // Fallback for browsers that support install via browser menu
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {/* Floating Bottom / Banner Prompt */}
      <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom duration-300">
        <div className="relative overflow-hidden rounded-2xl bg-[#141522]/95 backdrop-blur-xl border border-white/15 p-3.5 shadow-2xl shadow-black/80 flex items-center justify-between gap-3 text-right">
          {/* Subtle Ambient Glow */}
          <div className="absolute -left-10 -top-10 w-28 h-28 bg-[#FF2A55]/20 rounded-full blur-2xl pointer-events-none" />

          {/* App Icon + Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-md">
              <img src="/pwa-192x192.png" alt="ShortDrama Icon" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-black text-white truncate">تثبيت تطبيق ShortDrama</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FF2A55]/20 text-[#FF2A55] border border-[#FF2A55]/30">PWA</span>
              </div>
              <p className="text-[11px] text-gray-300 truncate">مشغل عمودي كامل وتجربة أسرع بدون متصفح 🎬</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FF2A55] to-[#FF4E3E] text-white text-xs font-bold shadow-lg shadow-[#FF2A55]/30 hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari / Manual Installation Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[#141522] border border-white/15 p-6 shadow-2xl text-right relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 border border-white/10 overflow-hidden shadow-xl">
              <img src="/pwa-192x192.png" alt="ShortDrama" className="w-full h-full object-cover" />
            </div>

            <h3 className="text-base font-black text-white text-center mb-1">
              تثبيت ShortDrama على هاتفك 📲
            </h3>
            <p className="text-xs text-gray-400 text-center mb-5">
              استمتع بتجربة ملء الشاشة الكاملة كأي تطبيق مثبت على هاتفك:
            </p>

            <div className="space-y-3 mb-6 bg-black/40 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FF2A55]/20 text-[#FF2A55] flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-300">
                  <strong>الخطوة 1:</strong> اضغط على زر <strong>المشاركة (Share)</strong> في شريط متصفحك.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-300">
                  <strong>الخطوة 2:</strong> مرر لأسفل واختر <strong>«إضافة إلى الشاشة الرئيسية»</strong> (Add to Home Screen).
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs text-gray-300">
                  <strong>الخطوة 3:</strong> سيظهر تطبيق ShortDrama على شاشتك الرئيسية فوراً.
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF2A55] to-[#FF4E3E] text-white font-bold text-xs shadow-lg shadow-[#FF2A55]/30 hover:opacity-95"
            >
              فهمت ذلك، شكراً!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
