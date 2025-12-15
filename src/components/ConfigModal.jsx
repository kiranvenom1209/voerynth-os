import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';

const ConfigModal = ({ isOpen, onClose, onSave, initialUrl, initialToken }) => {
    const { colors } = useAccentColor();
    const [url, setUrl] = useState(initialUrl);
    const [token, setToken] = useState(initialToken);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
            <div
                className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-[fadeIn_0.2s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-serif text-slate-100 flex items-center gap-3">
                        <Settings className={colors.text} size={24} />
                        Connection Settings
                    </h2>
                    <p className="text-xs text-slate-500 mt-2">Update Control Hub connection details</p>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-kumbh tracking-widest text-slate-500 mb-2">Control Hub URL</label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="http://controlhub.local:8123"
                            className={`w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 ${colors.focusBorder} outline-none font-mono text-sm`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-kumbh tracking-widest text-slate-500 mb-2">Long-Lived Access Token</label>
                        <textarea
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="eyJhbG..."
                            rows={4}
                            className={`w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 ${colors.focusBorder} outline-none font-mono text-xs resize-none`}
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg font-medium tracking-wide transition-all duration-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(url, token)}
                        className={`px-6 py-2.5 ${colors.bgSolid} ${colors.bgSolidHover} text-white rounded-lg font-medium tracking-wide transition-all duration-300 shadow-lg`}
                    >
                        Save & Reconnect
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigModal;
