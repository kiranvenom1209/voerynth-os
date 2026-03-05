import React from 'react';
import { useAccentColor } from '../context/AccentColorContext';

const Card = ({
    children,
    className = "",
    title,
    subtitle,
    action,
    delay = 0,
    noPadding = false,
    disableAnimation = false,
    editMode = false,
    onEditClick = null,
    cardId = null
}) => {
    const { colors } = useAccentColor();

    const handleClick = (e) => {
        console.log('🎴 Card clicked:', { editMode, cardId, hasOnEditClick: !!onEditClick });
        if (editMode && onEditClick && cardId) {
            e.stopPropagation(); // Prevent event bubbling
            console.log('✅ Opening card editor for:', cardId);
            onEditClick(cardId);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative bg-slate-900/80 backdrop-blur-lg border shadow-2xl overflow-hidden flex flex-col ${disableAnimation ? '' : 'animate-[slideUpFade_0.6s_ease-out_both]'} transition-all duration-500 ${className} ${
                editMode
                    ? `${colors.border} border-2 animate-[glow_2s_ease-in-out_infinite] cursor-pointer hover:scale-[1.02] active:scale-[0.98]`
                    : 'border-slate-700/50 hover:border-slate-600/70'
            }`}
            style={{ animationDelay: disableAnimation ? '0ms' : `${delay}ms` }}
        >
            {/* Corner Accents */}
            <div className={`absolute top-0 left-0 w-2 h-2 border-t border-l ${colors.borderSoft} rounded-tl-sm transition-colors duration-500`}></div>
            <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${colors.borderSoft} rounded-tr-sm transition-colors duration-500`}></div>
            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${colors.borderSoft} rounded-bl-sm transition-colors duration-500`}></div>
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-b border-r ${colors.borderSoft} rounded-br-sm transition-colors duration-500`}></div>

            {(title || action) && (
                <div className="flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800/50 bg-slate-900/40 relative z-10">
                    <div>
                        {title && <h3 className="font-serif text-slate-200 tracking-wider text-base sm:text-lg transition-colors duration-500">{title}</h3>}
                        {subtitle && <p className={`font-kumbh ${colors.text}/60 text-xs tracking-widest mt-1`}>{subtitle}</p>}
                    </div>
                    {action}
                </div>
            )}
            <div className={`relative z-10 flex-1 ${noPadding ? 'p-0' : 'p-4 sm:p-6'}`}>
                {children}
            </div>
            {/* Subtle grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        </div>
    );
};

export default React.memo(Card);
