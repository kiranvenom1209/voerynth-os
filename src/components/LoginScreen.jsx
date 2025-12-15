import React, { useState, useEffect } from 'react';
import CompanyLogo from './CompanyLogo';
import { useAccentColor } from '../context/AccentColorContext';
import * as storage from '../utils/storage';

const LoginScreen = ({ onConnect }) => {
    const { colors } = useAccentColor();
    const [url, setUrl] = useState('');
    const [token, setToken] = useState('');
    const [showCredentials, setShowCredentials] = useState(false);

    // Load saved credentials on mount
    useEffect(() => {
        const loadCredentials = async () => {
            const savedUrl = await storage.getItem('voerynth_ha_url');
            const savedToken = await storage.getItem('voerynth_ha_token');
            if (savedUrl) setUrl(savedUrl);
            if (savedToken) setToken(savedToken);
        };
        loadCredentials();
    }, []);

    const handleConnect = () => {
        if (url && token) {
            onConnect(url, token);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${colors.bgSoft} rounded-full blur-[150px] animate-[pulse_4s_ease-in-out_infinite]`}></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-[150px] animate-[pulse_5s_ease-in-out_infinite_1s]"></div>
                <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 50% 50%, rgba(${colors.rgb}, 0.05), transparent 70%)` }}></div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-md mx-4">
                {/* Logo and Title */}
                <div className="mb-12 text-center animate-[fadeIn_0.8s_ease-out]">
                    <div className="mb-6 flex justify-center animate-[float_3s_ease-in-out_infinite]">
                        <CompanyLogo className={`w-24 h-24 ${colors.text} ${colors.glow}`} />
                    </div>
                    <h1 className="font-serif text-4xl text-slate-100 tracking-[0.3em] mb-2">
                        VŒRYNTH
                    </h1>
                    <p className={`text-xs ${colors.text}/80 uppercase tracking-[0.5em] mb-4`}>
                        Système OS v4.1.0
                    </p>
                    <p className="text-sm text-red-400 flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        System Offline
                    </p>
                </div>

                {/* Login Card */}
                <div className="w-full bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl animate-[fadeIn_1s_ease-out_0.3s_both]">
                    {!showCredentials ? (
                        <div className="p-8 text-center">
                            <p className="text-slate-400 mb-6">Connect to Control Hub to continue</p>
                            <button
                                onClick={() => setShowCredentials(true)}
                                className={`w-full px-6 py-4 ${colors.bgSolid} ${colors.bgSolidHover} text-white rounded-lg font-medium tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl`}
                            >
                                Connect to System
                            </button>
                        </div>
                    ) : (
                        <div className="p-8">
                            <h3 className="text-lg font-serif text-slate-100 mb-6 text-center">System Credentials</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-kumbh tracking-widest text-slate-500 mb-2">Control Hub URL</label>
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="http://controlhub.local:8123"
                                        className={`w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 ${colors.focusBorder} outline-none font-mono text-sm transition-colors`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-kumbh tracking-widest text-slate-500 mb-2">Access Token</label>
                                    <textarea
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="eyJhbG..."
                                        rows={4}
                                        className={`w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 ${colors.focusBorder} outline-none font-mono text-xs transition-colors resize-none`}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowCredentials(false)}
                                    className="flex-1 px-4 py-3 text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg font-medium tracking-wide transition-all duration-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConnect}
                                    className={`flex-1 px-6 py-3 ${colors.bgSolid} ${colors.bgSolidHover} text-white rounded-lg font-medium tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl`}
                                >
                                    Connect
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
