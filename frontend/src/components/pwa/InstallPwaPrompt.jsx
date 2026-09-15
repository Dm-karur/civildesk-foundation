import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare } from 'lucide-react';

export default function InstallPwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (already installed)
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(checkStandalone);

    // Check if user previously dismissed today
    const dismissedUntil = localStorage.getItem('civildesk_pwa_dismissed');
    if (dismissedUntil && new Date().getTime() < Number(dismissedUntil)) {
      setIsDismissed(true);
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 24 hours
    localStorage.setItem('civildesk_pwa_dismissed', String(new Date().getTime() + 24 * 60 * 60 * 1000));
  };

  // Do not show if already in standalone app or dismissed
  if (isStandalone || isDismissed) {
    return null;
  }

  // Show Android / Desktop Install banner if deferredPrompt is available
  if (deferredPrompt) {
    return (
      <aside aria-label="Install KS Construction App" className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl p-4 flex items-center gap-3.5">
          <img
            src="/ks.png"
            alt="KS Construction"
            className="w-12 h-12 rounded-xl shadow-md border border-slate-600/50 object-contain shrink-0 bg-white/5 p-1"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold tracking-tight text-white truncate">
              Install KS Construction App
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 leading-snug">
              Add to your mobile home screen for quick offline-ready access.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark active:scale-95 text-white text-xs font-medium rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // If on iOS and not standalone, show a helpful prompt to Add to Home Screen
  if (isIOS && !showIOSPrompt && !isDismissed) {
    return (
      <aside aria-label="Install App for iOS" className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl p-4 flex items-center gap-3.5">
          <img
            src="/ks.png"
            alt="KS Construction"
            className="w-12 h-12 rounded-xl shadow-md border border-slate-600/50 object-contain shrink-0 bg-white/5 p-1"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold tracking-tight text-white">
              KS Construction on Mobile
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Install as an app on your iPhone or iPad.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowIOSPrompt(true)}
              className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-lg shadow transition-all flex items-center gap-1"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>How to</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Close"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  if (isIOS && showIOSPrompt) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-white shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src="/ks.png" alt="KS Construction" className="w-10 h-10 rounded-xl object-contain" />
              <div>
                <h3 className="font-semibold text-sm">Install KS Construction</h3>
                <p className="text-xs text-slate-400">iOS Safari</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowIOSPrompt(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs text-slate-300">
            <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
              <div>
                Tap the <strong className="text-white">Share</strong> button <Share className="inline w-3.5 h-3.5 mx-1 text-primary-light" /> in Safari's bottom toolbar.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
              <div>
                Scroll down and select <strong className="text-white">Add to Home Screen</strong> <PlusSquare className="inline w-3.5 h-3.5 mx-1 text-primary-light" />.
              </div>
            </div>

            <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <span className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
              <div>
                Tap <strong className="text-white">Add</strong> at top right to install KS Construction!
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowIOSPrompt(false)}
            className="w-full mt-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-xl transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return null;
}
