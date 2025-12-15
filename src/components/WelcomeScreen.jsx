import React from 'react';
import { ShieldCheck, Sparkles, Zap } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import { useAccentColor } from '../context/AccentColorContext';

/**
 * --- FIRST TIME SETUP: WELCOME SCREEN ---
 */
const WelcomeScreen = ({ onContinue }) => {
    const { colors } = useAccentColor();

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center overflow-y-auto">
            {/* Splash-style background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${colors.bgSoft} rounded-full blur-[150px] animate-[pulse_4s_ease-in-out_infinite]`}></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-[150px] animate-[pulse_5s_ease-in-out_infinite_1s]"></div>
                <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 50% 50%, rgba(${colors.rgb}, 0.05), transparent 70%)` }}></div>
            </div>

            <div className="relative z-10 max-w-2xl w-full px-4 sm:px-6 py-6 sm:py-8 my-auto">
                <div className="text-center mb-8 sm:mb-12 animate-[fadeIn_1s_ease-out]">
                    <div className="mb-4 sm:mb-6 animate-[float_3s_ease-in-out_infinite]">
                        <CompanyLogo className={`w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 ${colors.text} mx-auto ${colors.glow}`} />
                    </div>
                    <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-slate-100 tracking-[0.3em] mb-3 sm:mb-4">
                        VŒRYNTH
                    </h1>
                    <p className={`text-sm sm:text-base md:text-lg ${colors.text}/80 uppercase tracking-[0.4em] mb-2`}>
                        Système OS
                    </p>
                    <p className="text-xs sm:text-sm text-slate-400 tracking-wider">v5.0.1 • Stable</p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 animate-[fadeIn_1s_ease-out_0.3s_both] shadow-2xl">
                    <h2 className="text-xl sm:text-2xl font-serif text-slate-100 mb-3 sm:mb-4 text-center">Welcome to Your Estate</h2>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4 sm:mb-6 text-center">
                        Vœrynth Système OS is your sophisticated command interface for intelligent estate management.
                        Experience elegant control over lighting, climate, security, energy, and entertainment—all from
                        a single, refined dashboard.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
                        <div className="text-center p-3 sm:p-4 group cursor-default">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${colors.bgSoft} flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-500`}>
                                <ShieldCheck className={`${colors.text} w-5 h-5 sm:w-6 sm:h-6`} />
                            </div>
                            <h3 className="text-xs sm:text-sm text-slate-200 mb-1">Private & Secure</h3>
                            <p className="text-xs text-slate-400">All data stays on your local network</p>
                        </div>

                        <div className="text-center p-3 sm:p-4 group cursor-default">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${colors.bgSoft} flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-500`}>
                                <Sparkles className={`${colors.text} w-5 h-5 sm:w-6 sm:h-6`} />
                            </div>
                            <h3 className="text-xs sm:text-sm text-slate-200 mb-1">Elegant Design</h3>
                            <p className="text-xs text-slate-400">Sophisticated, regal interface</p>
                        </div>

                        <div className="text-center p-3 sm:p-4 group cursor-default">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${colors.bgSoft} flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-500`}>
                                <Zap className={`${colors.text} w-5 h-5 sm:w-6 sm:h-6`} />
                            </div>
                            <h3 className="text-xs sm:text-sm text-slate-200 mb-1">Powerful Control</h3>
                            <p className="text-xs text-slate-400">Manage your entire estate</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onContinue}
                    className={`w-full py-3 sm:py-4 rounded-xl ${colors.bgSolid} text-slate-950 text-sm sm:text-base tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg ${colors.shadow} animate-[fadeIn_1s_ease-out_0.6s_both] touch-manipulation`}
                >
                    GET STARTED
                </button>
            </div>
        </div>
    );
};

export default WelcomeScreen;
