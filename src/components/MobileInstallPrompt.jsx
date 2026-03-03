import React, { useState, useEffect } from 'react';
import { Share, Download, X } from 'lucide-react';

const MobileInstallPrompt = () => {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Detect if app is already installed/running in standalone mode
        const checkStandalone = () => {
            return window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone ||
                document.referrer.includes('android-app://');
        };

        if (checkStandalone()) {
            setIsStandalone(true);
            return;
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isIOSDevice);

        // If iOS and not installed, show the prompt (since iOS doesn't support beforeinstallprompt)
        if (isIOSDevice) {
            // Check if we've already dismissed it recently (optional)
            const hasDismissed = localStorage.getItem('voerynth_pwa_dismissed');
            if (!hasDismissed) {
                // Slight delay so it doesn't instantly jump at the user
                setTimeout(() => setShowPrompt(true), 2000);
            }
        }

        // Listen for Chrome/Android install prompt
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            const hasDismissed = localStorage.getItem('voerynth_pwa_dismissed');
            if (!hasDismissed) {
                setShowPrompt(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Detect successful install
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setShowPrompt(false);
            setIsStandalone(true);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the native install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setShowPrompt(false);
        }

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Save dismissal state for a few days so it doesn't annoy them
        localStorage.setItem('voerynth_pwa_dismissed', 'true');
    };

    // Do not render if already installed or if neither trigger fired
    if (isStandalone || !showPrompt) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[99999] p-4 animate-[slideUp_0.5s_ease-out]">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] rounded-2xl p-5 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>

                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors p-1"
                >
                    <X size={20} />
                </button>

                <div className="flex items-start gap-4">
                    <img src="/pwa-192x192.png" alt="App Icon" className="w-14 h-14 rounded-xl shadow-lg border border-slate-800" />
                    <div className="flex-1 pr-6">
                        <h3 className="text-white font-semibold text-base tracking-wide">Install Vœrynth OS</h3>

                        {isIOS ? (
                            <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                                Install this app on your device for native performance.
                                <br /><br />
                                Tap the <Share size={16} className="inline-block mx-1 mb-1 text-blue-400" /> <b>Share</b> button in your browser menu, then select <br />
                                <span className="text-white bg-slate-800 px-2 py-1 rounded text-xs mt-2 inline-flex items-center shadow-inner">
                                    <span className="text-xl leading-none mr-2">+</span> Add to Home Screen
                                </span>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm text-slate-400 mt-1 mb-4">
                                    Install the app for a native, full-screen experience on your device.
                                </p>
                                <button
                                    onClick={handleInstallClick}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                                >
                                    <Download size={18} />
                                    Install App
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Global animation injected if not present elsewhere */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}} />
        </div>
    );
};

export default MobileInstallPrompt;
