import React from 'react';
import { useAccentColor } from '../context/AccentColorContext';

const SidebarItem = ({ id, icon: Icon, label, active, onClick }) => {
    const { colors } = useAccentColor();

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center space-x-4 px-4 md:px-6 py-3.5 md:py-4 transition-all duration-500 group relative overflow-hidden active:scale-95 touch-manipulation
        ${active ? `${colors.text400} ${colors.gradientBg} border-l-4 ${colors.border}` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
        >
            <Icon size={22} className={`transition-all duration-500 ${active ? colors.glow : 'group-hover:scale-105'}`} />
            <span className={`font-kumbh tracking-widest uppercase text-xs transition-all duration-500 ${active ? 'font-medium' : 'font-normal'}`}>{label}</span>
            {active && <div className={`absolute right-0 top-0 h-full w-full ${colors.gradientPulse} animate-[pulse_4s_infinite]`} />}
        </button>
    );
};

export default React.memo(SidebarItem);
