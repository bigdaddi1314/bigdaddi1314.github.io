import React, { useState } from 'react';
import { Download, PlusSquare, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card' | 'footer';
  onToast?: (msg: string) => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  onToast,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  // On header, show only if browser supports native install or user is on iOS
  if (variant === 'header' && !isInstallable && !isIOS) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted && onToast) {
        onToast('Maison 704 installed to your home screen!');
      }
      return;
    }
    setShowGuide(true);
  };

  return (
    <>
      {variant === 'header' && (
        <button
          type="button"
          onClick={handleClick}
          className="min-h-[40px] px-3 py-1.5 rounded-full border border-[#DCE4EC] bg-white hover:border-[#0085CA] text-xs font-semibold text-[#0B1117] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          aria-label="Install Maison 704 App"
        >
          <Download className="w-3.5 h-3.5 text-[#0085CA]" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {variant === 'card' && (
        <div className="rounded-2xl bg-[#EEF3F7] border border-[#DCE4EC] p-4 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#DCE4EC] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-[#0085CA]" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#0B1117]">
                Add Maison 704 to Home Screen
              </p>
              <p className="text-[11px] text-[#475569]">
                Shop &amp; design purses like a native app on iPhone &amp; Android.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="min-h-[38px] px-3.5 py-1.5 rounded-full bg-[#0B1117] hover:bg-[#0085CA] text-white text-xs font-semibold shrink-0 transition-colors"
          >
            {isInstallable ? 'Install' : 'How to Add'}
          </button>
        </div>
      )}

      {variant === 'footer' && (
        <button
          type="button"
          onClick={handleClick}
          className="text-xs font-semibold text-[#0085CA] hover:text-[#0B1117] inline-flex items-center gap-1.5 transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install on iPhone or Android</span>
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 bg-[#0B1117]/50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-[#DCE4EC] p-6 space-y-5 shadow-2xl pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#009CA6] uppercase">
                  iPhone &amp; Android App Experience
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#0B1117] mt-1">
                  Install Maison 704
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close install guide"
                className="w-9 h-9 rounded-full bg-[#EEF3F7] text-[#0B1117] flex items-center justify-center hover:bg-[#DCE4EC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#475569]">
              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E6F4FB] text-[#0085CA] flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#0B1117] text-xs">
                    On iPhone / iPad (Safari)
                  </p>
                  <p className="text-xs mt-0.5 leading-relaxed">
                    Tap the <strong>Share</strong> icon in Safari’s bottom toolbar, scroll down, and select <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#DCE4EC] flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E6F7F8] text-[#009CA6] flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#0B1117] text-xs">
                    On Android (Chrome)
                  </p>
                  <p className="text-xs mt-0.5 leading-relaxed">
                    Tap the <strong>⋮ menu</strong> in the top-right corner and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[46px] rounded-full bg-[#0B1117] text-white text-xs font-semibold hover:bg-[#0085CA] transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="bg-[#0B1117] text-white text-xs py-2 px-4 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#5EEAD4] shrink-0" />
      <span>
        You’re browsing offline. Your saved catalog and 3D Purse Studio remain available; checkout syncs once reconnected.
      </span>
    </div>
  );
};
