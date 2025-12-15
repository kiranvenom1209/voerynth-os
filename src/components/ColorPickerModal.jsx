import React from 'react';
import { XCircle } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';
import { useHomeAssistant } from '../context/HomeAssistantContext';

const ColorPickerModal = ({ isOpen, onClose, entityId, currentColor }) => {
    const { colors } = useAccentColor();
    const { callService } = useHomeAssistant();

    if (!isOpen) return null;

    const presets = [[255, 255, 255], [255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 165, 0], [255, 0, 255], [0, 255, 255], [255, 255, 0]];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
            <div className={`bg-slate-900 border ${colors.borderSoft} p-6 rounded-xl shadow-2xl w-full max-w-sm relative animate-[slideUpFade_0.4s_ease-out]`}>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-all duration-300"><XCircle /></button>
                <h3 className="text-lg font-serif text-slate-100 mb-4">Light Color Spectrum</h3>
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {presets.map((rgb, i) => (
                        <button
                            key={i}
                            onClick={() => callService('light', 'turn_on', { entity_id: entityId, rgb_color: rgb })}
                            className="w-12 h-12 rounded-full border border-slate-600 hover:scale-105 hover:border-slate-400 transition-all duration-300 shadow-lg"
                            style={{ backgroundColor: `rgb(${rgb.join(',')})` }}
                        />
                    ))}
                </div>
                <div className="space-y-2">
                    <p className="text-xs text-slate-500 tracking-widest text-center">Hue Spectrum</p>
                    <input
                        type="range" min="0" max="360"
                        className="w-full h-3 rounded-lg appearance-none cursor-pointer transition-all duration-300"
                        style={{ background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)' }}
                        onChange={(e) => callService('light', 'turn_on', { entity_id: entityId, hs_color: [parseInt(e.target.value), 100] })}
                    />
                </div>
                <button onClick={onClose} className={`w-full mt-6 py-2 bg-slate-800 rounded text-slate-300 ${colors.bgHover} ${colors.borderHover} border border-transparent transition-all duration-300`}>Done</button>
            </div>
        </div>
    );
};

export default ColorPickerModal;
