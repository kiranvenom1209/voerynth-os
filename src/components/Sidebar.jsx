import React, { useCallback, useRef, useState } from 'react';
import { LayoutDashboard, Lightbulb, Tv, ShieldCheck, Zap, Download, Activity, Sliders, Settings } from 'lucide-react';
import SidebarItem from './SidebarItem';
import CompanyLogo from './CompanyLogo';
import { useAccentColor } from '../context/AccentColorContext';

const Sidebar = ({
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    editMode = false,
    setEditMode = null
}) => {
    const { colors } = useAccentColor();
    const longPressTimerRef = useRef(null);
    const [isLongPressing, setIsLongPressing] = useState(false);

    const handleTabClick = useCallback((tabId) => {
        if (activeTab === tabId) return;
        setActiveTab(tabId);
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }, [activeTab, setActiveTab, setSidebarOpen]);

    return (
        <nav className={`
          fixed md:relative z-40 h-full bg-slate-950/95 md:bg-slate-900/60 backdrop-blur-xl border-r border-slate-800/60 flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        `}>
            <div className="p-6 flex items-center justify-center border-b border-slate-800/50 h-24">
                <div
                    className={`text-center animate-[fadeIn_0.5s_ease-out] flex flex-col items-center cursor-pointer select-none transition-all duration-300 ${
                        isLongPressing ? 'scale-110 ring-2 ring-offset-2 ring-offset-slate-950' : ''
                    } ${isLongPressing ? colors.ring : ''}`}
                    onClick={() => {
                        if (editMode && setEditMode) {
                            setEditMode(false);
                            console.log('❌ Exiting edit mode...');
                        }
                    }}
                    onTouchStart={() => {
                        setIsLongPressing(false);
                        longPressTimerRef.current = setTimeout(() => {
                            setIsLongPressing(true);
                            if (setEditMode) {
                                setEditMode(true);
                                setSidebarOpen(false);
                            }
                            if (window.navigator.vibrate) {
                                window.navigator.vibrate(50);
                            }
                            console.log('🔧 Activating edit mode...');
                        }, 500);
                    }}
                    onTouchEnd={() => {
                        if (longPressTimerRef.current) {
                            clearTimeout(longPressTimerRef.current);
                        }
                        setTimeout(() => setIsLongPressing(false), 100);
                    }}
                    onMouseDown={() => {
                        setIsLongPressing(false);
                        longPressTimerRef.current = setTimeout(() => {
                            setIsLongPressing(true);
                            if (setEditMode) {
                                setEditMode(true);
                                setSidebarOpen(false);
                            }
                        }, 500);
                    }}
                    onMouseUp={() => {
                        if (longPressTimerRef.current) {
                            clearTimeout(longPressTimerRef.current);
                        }
                        setTimeout(() => setIsLongPressing(false), 100);
                    }}
                    onMouseLeave={() => {
                        if (longPressTimerRef.current) {
                            clearTimeout(longPressTimerRef.current);
                        }
                        setIsLongPressing(false);
                    }}
                >
                    <CompanyLogo className={`w-8 h-8 mb-2 transition-all duration-300 ${
                        editMode ? `${colors.text} animate-pulse` : colors.text
                    }`} />
                    <h1 className="font-serif text-lg text-slate-100 tracking-[0.2em] leading-none">VŒRYNTH</h1>
                    <p className={`text-[0.5rem] ${colors.text}/80 uppercase tracking-[0.4em] mt-1`}>Système OS v5.0.1</p>
                </div>
            </div>

            <div className="flex-1 py-8 space-y-1 overflow-y-auto">
                <SidebarItem id="dashboard" icon={LayoutDashboard} label="Main Deck" active={activeTab === 'dashboard'} onClick={() => handleTabClick('dashboard')} />
                <SidebarItem id="lights" icon={Lightbulb} label="Chambers" active={activeTab === 'lights'} onClick={() => handleTabClick('lights')} />
                <SidebarItem id="media" icon={Tv} label="Entertainment" active={activeTab === 'media'} onClick={() => handleTabClick('media')} />
                <SidebarItem id="security" icon={ShieldCheck} label="Security" active={activeTab === 'security'} onClick={() => handleTabClick('security')} />
                <SidebarItem id="energy" icon={Zap} label="Energy" active={activeTab === 'energy'} onClick={() => handleTabClick('energy')} />
                <SidebarItem id="updates" icon={Download} label="Updates" active={activeTab === 'updates'} onClick={() => handleTabClick('updates')} />
                <SidebarItem id="network" icon={Activity} label="System" active={activeTab === 'network'} onClick={() => handleTabClick('network')} />
            </div>

            <div className="p-4 border-t border-slate-800/50 flex flex-col gap-2">
                <button
                    onClick={() => handleTabClick('settings')}
                    className={`w-full flex items-center justify-center space-x-3 p-3 rounded-lg transition-all duration-300 group active:scale-95 ${activeTab === 'settings'
                        ? `${colors.text400} ${colors.bg} border ${colors.borderSoft}`
                        : `text-slate-500 ${colors.textHover} ${colors.bgHover}`
                        }`}>
                    <Settings size={18} className="transition-transform duration-300" />
                    <span className="text-[10px] tracking-widest">Settings</span>
                </button>
                <button
                    onClick={() => handleTabClick('advanced')}
                    className={`w-full flex items-center justify-center space-x-3 p-3 rounded-lg transition-all duration-300 group active:scale-95 ${activeTab === 'advanced'
                        ? `${colors.text400} ${colors.bg} border ${colors.borderSoft}`
                        : `text-slate-500 ${colors.textHover} ${colors.bgHover}`
                        }`}>
                    <Sliders size={18} className="transition-transform duration-300" />
                    <span className="text-[10px] tracking-widest">Advanced</span>
                </button>
            </div>
        </nav>
    );
};

export default React.memo(Sidebar);
