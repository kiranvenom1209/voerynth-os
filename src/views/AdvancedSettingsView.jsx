import { useState, useEffect } from 'react';
import { Sliders, Palette, Wifi, Power, List, Cpu, Activity, LogOut, Settings, RefreshCw, AlertTriangle, ArrowDown } from 'lucide-react';
import CompanyLogo from '../components/CompanyLogo';
import SystemLogsContent from '../components/SystemLogsContent';
import WakeWordDebugger from '../components/WakeWordDebugger';
import { useAccentColor } from '../context/AccentColorContext';
import { useHomeAssistant } from '../context/HomeAssistantContext';
import * as storage from '../utils/storage';

const AdvancedSettingsView = ({
    animationSpeed,
    setAnimationSpeed,
    particleCount,
    setParticleCount,
    reducedMotion,
    setReducedMotion,
    screenSaverEnabled,
    setScreenSaverEnabled,
    screenSaverTimeout,
    setScreenSaverTimeout,
    screenSaverBrightness,
    setScreenSaverBrightness,
    autoBrightnessMode,
    setAutoBrightnessMode,
    wakeWordEnabled,
    setWakeWordEnabled,
    wakeWordListening,
    wakeWordTriggered,
    onOpenConfig,
    onLogout
}) => {
    const { accentColor, setAccentColor, colors } = useAccentColor();
    const { hassStates, callService, systemRestarting, setSystemRestarting } = useHomeAssistant();
    const [debugMode, setDebugMode] = useState(false);
    const [animationSpeedOpen, setAnimationSpeedOpen] = useState(false);
    const [particleCountOpen, setParticleCountOpen] = useState(false);
    const [screenSaverTimeoutOpen, setScreenSaverTimeoutOpen] = useState(false);
    const [screenSaverBrightnessOpen, setScreenSaverBrightnessOpen] = useState(false);
    const [aboutOpen, setAboutOpen] = useState(false);
    const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
    const [restartError, setRestartError] = useState(null);

    // Load debug mode on mount
    useEffect(() => {
        const loadDebugMode = async () => {
            const debug = await storage.getItem('voerynth_debug_mode');
            if (debug) setDebugMode(debug === 'true');
        };
        loadDebugMode();
    }, []);

    const handleSave = async (key, value) => {
        await storage.setItem(key, value);
    };

    const handleRestartConfirm = async () => {
        setRestartConfirmOpen(false);
        setSystemRestarting(true);
        setRestartError(null);

        try {
            await callService('homeassistant', 'restart', {});
            // Keep restarting state - the connection will drop and reconnect automatically
        } catch (error) {
            console.error('Failed to restart Control Hub:', error);
            setRestartError(error.message || 'Restart failed. Please try again or restart from the Control Hub system panel.');
            setSystemRestarting(false);
        }
    };

    const SettingCard = ({ title, description, children, noHover = false }) => (
        <div className={`bg-slate-900/40 backdrop-blur border border-slate-800/50 rounded-xl p-6 transition-all duration-300 ${!noHover ? colors.borderHover : ''}`}>
            <h3 className="text-lg font-serif text-slate-100 mb-2">{title}</h3>
            <p className="text-xs text-slate-500 mb-4 tracking-wide">{description}</p>
            {children}
        </div>
    );

    const ToggleSwitch = ({ enabled, onChange }) => (
        <button
            onClick={() => onChange(!enabled)}
            className={`relative w-11 h-6 sm:w-14 sm:h-7 rounded-full border-2 transition-all duration-300 flex-shrink-0 ${enabled ? `${colors.bg} ${colors.borderSoft}` : 'bg-slate-700/80 border-slate-600'
                }`}
        >
            <div
                className={`absolute top-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-300 shadow-md ${enabled
                    ? `left-5 sm:left-7 ${colors.bgSolid} ${colors.shadowGlow}`
                    : 'left-0.5 bg-slate-300'
                    }`}
            />
        </button>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className={`p-3 ${colors.bg} rounded-xl border ${colors.borderSoft}`}>
                    <Sliders className={colors.text} size={28} />
                </div>
                <div>
                    <h1 className="text-3xl font-serif text-slate-100">Advanced Settings</h1>
                    <p className="text-sm text-slate-500 tracking-wide mt-1">Fine-tune your Vœrynth OS experience</p>
                </div>
            </div>

            {/* UI Preferences */}
            <div className="space-y-4">
                <h2 className="text-xl font-serif text-slate-300 flex items-center gap-2">
                    <Palette size={20} className={colors.text} />
                    Interface Preferences
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SettingCard
                        title="Accent Color"
                        description="Choose the primary accent color for the interface"
                    >
                        <div className="flex gap-3">
                            {['amber', 'emerald', 'blue', 'purple', 'rose'].map((color) => (
                                <button
                                    key={color}
                                    onClick={() => {
                                        setAccentColor(color);
                                        handleSave('voerynth_accent_color', color);
                                    }}
                                    className={`w-10 h-10 rounded-lg border-2 transition-all duration-300 ${accentColor === color ? 'border-white scale-110' : 'border-transparent'
                                        } ${color === 'amber' ? 'bg-amber-500' :
                                            color === 'emerald' ? 'bg-emerald-500' :
                                                color === 'blue' ? 'bg-blue-500' :
                                                    color === 'purple' ? 'bg-purple-500' :
                                                        'bg-rose-500'
                                        }`}
                                />
                            ))}
                        </div>
                    </SettingCard>

                    <SettingCard
                        title="Animation Speed"
                        description="Control the speed of UI animations"
                        noHover={true}
                    >
                        <div className="relative">
                            <button
                                onClick={() => setAnimationSpeedOpen(!animationSpeedOpen)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 outline-none cursor-pointer flex items-center justify-between"
                            >
                                <span>
                                    {animationSpeed === 'slow' ? 'Slow (Elegant)' :
                                        animationSpeed === 'fast' ? 'Fast (Responsive)' : 'Normal'}
                                </span>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${animationSpeedOpen ? 'rotate-180' : ''}`}>
                                    <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </SettingCard>

                    <SettingCard
                        title="Reduced Motion"
                        description="Minimize animations for accessibility"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">
                                {reducedMotion ? 'Enabled' : 'Disabled'}
                            </span>
                            <ToggleSwitch
                                enabled={reducedMotion}
                                onChange={(val) => {
                                    setReducedMotion(val);
                                    handleSave('voerynth_reduced_motion', val);
                                }}
                            />
                        </div>
                    </SettingCard>

                    <SettingCard
                        title="Particle Effects"
                        description="Number of particles in flow animations"
                        noHover={true}
                    >
                        <div className="relative">
                            <button
                                onClick={() => setParticleCountOpen(!particleCountOpen)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 outline-none cursor-pointer flex items-center justify-between"
                            >
                                <span>
                                    {particleCount === 1 ? 'Minimal (1)' :
                                        particleCount === 5 ? 'Rich (5)' :
                                            particleCount === 8 ? 'Maximum (8)' : 'Normal (3)'}
                                </span>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${particleCountOpen ? 'rotate-180' : ''}`}>
                                    <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </SettingCard>

                    <SettingCard
                        title="Screen Saver"
                        description="Show logo and time on inactivity"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">
                                {screenSaverEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <ToggleSwitch
                                enabled={screenSaverEnabled}
                                onChange={(val) => {
                                    setScreenSaverEnabled(val);
                                    handleSave('voerynth_screensaver_enabled', val);
                                }}
                            />
                        </div>
                    </SettingCard>

                    <SettingCard
                        title="Screen Saver Timeout"
                        description="Seconds of inactivity before screen saver"
                        noHover={true}
                    >
                        <div className="relative">
                            <button
                                onClick={() => setScreenSaverTimeoutOpen(!screenSaverTimeoutOpen)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 outline-none cursor-pointer flex items-center justify-between"
                            >
                                <span>
                                    {screenSaverTimeout === 15 ? '15 seconds' :
                                        screenSaverTimeout === 30 ? '30 seconds' :
                                            screenSaverTimeout === 60 ? '1 minute' :
                                                screenSaverTimeout === 120 ? '2 minutes' :
                                                    screenSaverTimeout === 300 ? '5 minutes' : `${screenSaverTimeout} seconds`}
                                </span>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${screenSaverTimeoutOpen ? 'rotate-180' : ''}`}>
                                    <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </SettingCard>

                    <SettingCard
                        title="Auto Brightness Mode"
                        description="Automatically adjust brightness based on ambient light sensor (5% when dark outside + bedroom + bathroom)"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">
                                {autoBrightnessMode ? 'Auto (Sensor-based)' : 'Manual (Fixed)'}
                            </span>
                            <ToggleSwitch
                                enabled={autoBrightnessMode}
                                onChange={(val) => {
                                    setAutoBrightnessMode(val);
                                    handleSave('voerynth_auto_brightness_mode', val);
                                }}
                            />
                        </div>
                    </SettingCard>

                    <SettingCard
                        title="Screen Saver Brightness"
                        description={autoBrightnessMode ? "Auto mode: Adjusts 5-40% based on room light" : "Manual mode: Fixed brightness level"}
                        noHover={true}
                    >
                        <div className="relative">
                            <button
                                onClick={() => !autoBrightnessMode && setScreenSaverBrightnessOpen(!screenSaverBrightnessOpen)}
                                className={`w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-200 outline-none flex items-center justify-between ${autoBrightnessMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                disabled={autoBrightnessMode}
                            >
                                <span>{autoBrightnessMode ? 'Auto (5-40%)' : `${screenSaverBrightness}%`}</span>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform ${screenSaverBrightnessOpen && !autoBrightnessMode ? 'rotate-180' : ''}`}>
                                    <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    </SettingCard>
                </div>
            </div>

            {/* Connection Management */}
            <div className="space-y-4 mt-8">
                <h2 className="text-xl font-serif text-slate-300 flex items-center gap-2">
                    <Wifi size={20} className={colors.text} />
                    Connection
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SettingCard
                        title="Control Hub Configuration"
                        description="Update connection URL and access token"
                    >
                        <button
                            onClick={onOpenConfig}
                            className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-700/50 hover:border-slate-600 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 group"
                        >
                            <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" />
                            Open Configuration
                        </button>
                    </SettingCard>

                    <SettingCard
                        title="Wake Word Detection"
                        description='Say "Hey Ammu" to activate voice assistant'
                    >
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-400">
                                    {wakeWordEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <ToggleSwitch
                                    enabled={wakeWordEnabled}
                                    onChange={(val) => {
                                        setWakeWordEnabled(val);
                                        handleSave('voerynth_wake_word_enabled', val);
                                    }}
                                />
                            </div>
                            {wakeWordEnabled && wakeWordListening && (
                                <div className="flex items-center gap-2 text-emerald-500 text-xs">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    <span>Listening for "Hey Ammu"...</span>
                                </div>
                            )}
                            {wakeWordEnabled && wakeWordTriggered && (
                                <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold animate-pulse">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                                    <span>Wake word detected! 🎙️</span>
                                </div>
                            )}
                        </div>
                    </SettingCard>

                    {/* Wake Word Debugger - Only show in debug mode */}
                    {debugMode && wakeWordEnabled && (
                        <div className="lg:col-span-2">
                            <WakeWordDebugger />
                        </div>
                    )}

                    <SettingCard
                        title="Disconnect"
                        description="Sign out and return to login screen"
                    >
                        <button
                            onClick={onLogout}
                            className="w-full bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-500/20 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95"
                        >
                            <LogOut size={14} />
                            Disconnect Now
                        </button>
                    </SettingCard>
                </div>
            </div>

            {/* System Management */}
            <div className="space-y-4 mt-8">
                <h2 className="text-xl font-serif text-slate-300 flex items-center gap-2">
                    <Power size={20} className={colors.text} />
                    System Management
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SettingCard
                        title="Restart Control Hub"
                        description="Safely restarts the Control Hub core. Automations will briefly pause."
                        noHover={systemRestarting}
                    >
                        {systemRestarting ? (
                            <div className="flex items-center gap-3 text-blue-400">
                                <RefreshCw size={16} className="animate-spin" />
                                <span className="text-sm">System restarting...</span>
                            </div>
                        ) : restartError ? (
                            <div className="space-y-3">
                                <div className="text-xs text-red-400/80 bg-red-500/10 px-3 py-2 rounded flex items-center gap-2">
                                    <AlertTriangle size={12} />
                                    {restartError}
                                </div>
                                <button
                                    onClick={() => setRestartConfirmOpen(true)}
                                    className="w-full bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-500/20 transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Power size={14} />
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setRestartConfirmOpen(true)}
                                className={`w-full ${colors.bg} border ${colors.borderSoft} ${colors.text400} rounded-lg px-4 py-2 text-sm font-medium hover:${colors.bgHover} transition-all duration-300 flex items-center justify-center gap-2 active:scale-95`}
                            >
                                <Power size={14} />
                                Restart Now
                            </button>
                        )}
                    </SettingCard>
                </div>
            </div>

            {/* System Logs */}
            <div className="space-y-4 mt-8">
                <h2 className="text-xl font-serif text-slate-300 flex items-center gap-2">
                    <List size={20} className={colors.text} />
                    System Logs
                </h2>

                <div className="bg-slate-900/40 backdrop-blur border border-slate-800/50 rounded-xl overflow-hidden">
                    <div className="bg-slate-950/50 border-b border-slate-800/50 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-mono text-slate-400">Live System Output</span>
                        </div>
                        <button
                            onClick={() => {
                                // Scroll to bottom of logs
                                const logsContainer = document.getElementById('system-logs-container');
                                if (logsContainer) {
                                    logsContainer.scrollTop = logsContainer.scrollHeight;
                                }
                            }}
                            className={`text-xs text-slate-500 hover:${colors.text400} transition-colors flex items-center gap-1`}
                        >
                            <ArrowDown size={12} />
                            Scroll to Bottom
                        </button>
                    </div>
                    <div
                        id="system-logs-container"
                        className="bg-slate-950/80 p-4 font-mono text-xs text-slate-300 h-64 overflow-y-auto scroll-smooth"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: 'rgb(71 85 105) rgb(15 23 42)'
                        }}
                    >
                        <SystemLogsContent hassStates={hassStates} debugMode={debugMode} />
                    </div>
                </div>
            </div>

            {/* Developer Options */}
            <div className="space-y-4 mt-8">
                <h2 className="text-xl font-serif text-slate-300 flex items-center gap-2">
                    <Cpu size={20} className={colors.text} />
                    Developer Options
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <SettingCard
                        title="Debug Mode"
                        description="Show console logs and debug information"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">
                                {debugMode ? 'Enabled' : 'Disabled'}
                            </span>
                            <ToggleSwitch
                                enabled={debugMode}
                                onChange={(val) => {
                                    setDebugMode(val);
                                    handleSave('voerynth_debug_mode', val);
                                }}
                            />
                        </div>
                    </SettingCard>
                </div>
            </div>

            {/* System Information */}
            <div className="space-y-4 mt-8">
                <h2 className="text-xl font-serif text-slate-300 flex items-center gap-2">
                    <Activity size={20} className={colors.text} />
                    System Information
                </h2>

                <div className="bg-slate-900/40 backdrop-blur border border-slate-800/50 rounded-xl p-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-slate-500">Version</span>
                            <p className="text-slate-200 font-mono">v5.0.2</p>
                        </div>
                        <div>
                            <span className="text-slate-500">Build</span>
                            <p className="text-slate-200 font-mono">2026.03.04</p>
                        </div>
                        <div>
                            <span className="text-slate-500">Platform</span>
                            <p className="text-slate-200 font-mono">React 19.2</p>
                        </div>
                        <div>
                            <span className="text-slate-500">Theme</span>
                            <p className="text-slate-200 font-mono capitalize">{accentColor}</p>
                        </div>
                    </div>
                </div>

                {/* About Button */}
                <button
                    onClick={() => setAboutOpen(true)}
                    className={`w-full mt-4 bg-slate-900/40 backdrop-blur border border-slate-800/50 rounded-xl p-4 ${colors.borderHover} transition-all duration-300 group`}
                >
                    <div className={`flex items-center justify-center gap-2 text-slate-300 group-hover:${colors.text400} transition-colors`}>
                        <Activity size={16} />
                        <span className="text-sm font-medium tracking-wide">About Vœrynth OS</span>
                    </div>
                </button>
            </div>

            {/* Animation Speed Modal */}
            {animationSpeedOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setAnimationSpeedOpen(false)}>
                    {/* Blurred backdrop */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>

                    {/* Centered modal */}
                    <div
                        className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden shadow-2xl w-full max-w-md mx-4 animate-[fadeIn_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-800">
                            <h3 className="text-lg font-serif text-slate-100">Animation Speed</h3>
                            <p className="text-xs text-slate-500 mt-1">Select animation speed preference</p>
                        </div>
                        <div className="p-2">
                            {['slow', 'normal', 'fast'].map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => {
                                        setAnimationSpeed(speed);
                                        handleSave('voerynth_animation_speed', speed);
                                        setAnimationSpeedOpen(false);
                                    }}
                                    className={`w-full p-4 text-left rounded-lg transition-all duration-300 ${animationSpeed === speed
                                        ? `${colors.bgSoft} ${colors.text400} border ${colors.borderSoft}`
                                        : 'text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <div className="font-medium">
                                        {speed === 'slow' ? 'Slow (Elegant)' :
                                            speed === 'fast' ? 'Fast (Responsive)' : 'Normal'}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {speed === 'slow' ? 'Graceful, regal animations' :
                                            speed === 'fast' ? 'Snappy, responsive feel' : 'Balanced animation timing'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Particle Count Modal */}
            {particleCountOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setParticleCountOpen(false)}>
                    {/* Blurred backdrop */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>

                    {/* Centered modal */}
                    <div
                        className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden shadow-2xl w-full max-w-md mx-4 animate-[fadeIn_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-800">
                            <h3 className="text-lg font-serif text-slate-100">Particle Effects</h3>
                            <p className="text-xs text-slate-500 mt-1">Select number of particles in flow animations</p>
                        </div>
                        <div className="p-2">
                            {[1, 3, 5, 8].map((count) => (
                                <button
                                    key={count}
                                    onClick={() => {
                                        setParticleCount(count);
                                        handleSave('voerynth_particle_count', count.toString());
                                        setParticleCountOpen(false);
                                    }}
                                    className={`w-full p-4 text-left rounded-lg transition-all duration-300 ${particleCount === count
                                        ? `${colors.bgSoft} ${colors.text400} border ${colors.borderSoft}`
                                        : 'text-slate-200 hover:bg-slate-800/50'
                                        }`}
                                >
                                    <div className="font-medium">
                                        {count === 1 ? 'Minimal (1)' :
                                            count === 5 ? 'Rich (5)' :
                                                count === 8 ? 'Maximum (8)' : 'Normal (3)'}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {count === 1 ? 'Subtle, minimal particle flow' :
                                            count === 5 ? 'Rich, detailed energy flow' :
                                                count === 8 ? 'Maximum visual density' : 'Balanced particle count'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Screen Saver Timeout Modal */}
            {screenSaverTimeoutOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setScreenSaverTimeoutOpen(false)}>
                    {/* Blurred backdrop */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>

                    {/* Centered modal */}
                    <div
                        className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-6 shadow-2xl w-full max-w-sm mx-4 animate-[fadeIn_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-serif text-slate-200 mb-4">Screen Saver Timeout</h3>
                        <div className="space-y-2">
                            {[
                                { value: 15, label: '15 seconds', desc: 'Quick activation' },
                                { value: 30, label: '30 seconds', desc: 'Default timing' },
                                { value: 60, label: '1 minute', desc: 'Relaxed timing' },
                                { value: 120, label: '2 minutes', desc: 'Extended delay' },
                                { value: 300, label: '5 minutes', desc: 'Maximum delay' }
                            ].map(({ value, label, desc }) => (
                                <button
                                    key={value}
                                    onClick={() => {
                                        setScreenSaverTimeout(value);
                                        handleSave('voerynth_screensaver_timeout', value.toString());
                                        setScreenSaverTimeoutOpen(false);
                                    }}
                                    className={`w-full p-4 text-left rounded-lg transition-all duration-300 ${screenSaverTimeout === value
                                        ? `${colors.bgSoft} border ${colors.borderSoft}`
                                        : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div className="font-medium">{label}</div>
                                    <div className="text-xs text-slate-500 mt-1">{desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Screen Saver Brightness Modal */}
            {screenSaverBrightnessOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setScreenSaverBrightnessOpen(false)}>
                    {/* Blurred backdrop */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>

                    {/* Centered modal */}
                    <div
                        className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-6 shadow-2xl w-full max-w-sm mx-4 animate-[fadeIn_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-serif text-slate-200 mb-4">Screen Saver Brightness</h3>
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                            {[5, 10, 15, 20, 25, 30, 35, 40].map((value) => (
                                <button
                                    key={value}
                                    onClick={() => {
                                        setScreenSaverBrightness(value);
                                        handleSave('voerynth_screensaver_brightness', value.toString());
                                        setScreenSaverBrightnessOpen(false);
                                    }}
                                    className={`w-full p-4 text-left rounded-lg transition-all duration-300 ${screenSaverBrightness === value
                                        ? `${colors.bgSoft} border ${colors.borderSoft}`
                                        : 'bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div className="font-medium">{value}%</div>
                                    <div className="text-xs text-slate-500 mt-1">
                                        {value === 5 ? 'Very dim - Maximum battery saving' :
                                            value === 10 ? 'Dim - Great for dark rooms' :
                                                value === 15 ? 'Low - Subtle visibility' :
                                                    value === 20 ? 'Moderate low - Easy on eyes' :
                                                        value === 25 ? 'Quarter brightness' :
                                                            value === 30 ? 'Moderate - Comfortable viewing' :
                                                                value === 35 ? 'Medium low' :
                                                                    'Bright - Maximum visibility'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* About Modal */}
            {aboutOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setAboutOpen(false)}>
                    {/* Blurred backdrop */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>

                    {/* Centered modal */}
                    <div
                        className="relative bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl overflow-hidden shadow-2xl w-full max-w-2xl mx-4 animate-[fadeIn_0.2s_ease-out] max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with Logo */}
                        <div className="p-8 border-b border-slate-800 text-center">
                            <div className="flex justify-center mb-4">
                                <CompanyLogo className={`w-16 h-16 ${colors.text}`} />
                            </div>
                            <h1 className="font-serif text-2xl text-slate-100 tracking-[0.2em] mb-2">VŒRYNTH SYSTÈME OS</h1>
                            <p className={`${colors.text}/80 text-sm tracking-[0.3em]`}>v5.0.2</p>
                            <div className="mt-4 flex justify-center gap-6 text-xs text-slate-500">
                                <div>
                                    <span className="text-slate-600">Build:</span> <span className="text-slate-400 font-mono">2026.03.04</span>
                                </div>
                                <div>
                                    <span className="text-slate-600">Platform:</span> <span className="text-slate-400 font-mono">React 19.2</span>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6 text-sm">
                            {/* Created By */}
                            <div>
                                <h3 className={`${colors.text} font-serif text-base mb-3 tracking-wide`}>Created by</h3>
                                <div className="space-y-2 text-slate-300">
                                    <p><span className="text-slate-100 font-medium">Kiran Karthikeyan Achari</span> – System Architect & Lead Developer</p>
                                </div>
                            </div>

                            {/* Design & Concept */}
                            <div>
                                <h3 className={`${colors.text} font-serif text-base mb-3 tracking-wide`}>Design & Concept</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    Vœrynth Estate Control Interface – a unified command deck for lighting, security, climate, media, and energy across the home.
                                </p>
                            </div>

                            {/* Copyright */}
                            <div>
                                <h3 className={`${colors.text} font-serif text-base mb-3 tracking-wide`}>Copyright</h3>
                                <p className="text-slate-300">© 2026 Vœrynth Systèmé. All rights reserved.</p>
                            </div>

                            {/* Technology Credits */}
                            <div>
                                <h3 className={`${colors.text} font-serif text-base mb-3 tracking-wide`}>Technology Credits</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    Powered by open standards and technologies supported by the Open Home Foundation and other open-source ecosystems.
                                    This project is an independent customization and is not affiliated with or endorsed by the Open Home Foundation or any other third party.
                                </p>
                            </div>

                            {/* License & Use */}
                            <div>
                                <h3 className={`${colors.text} font-serif text-base mb-3 tracking-wide`}>License & Use</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    Private prototype build for internal residential use only.
                                    Unauthorized distribution, resale, or commercial hosting is prohibited.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-800 text-center">
                            <button
                                onClick={() => setAboutOpen(false)}
                                className="px-8 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 rounded-lg text-amber-400 font-medium transition-all duration-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Restart Confirmation Modal */}
            {restartConfirmOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setRestartConfirmOpen(false)}>
                    {/* Blurred backdrop */}
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>

                    {/* Centered modal */}
                    <div
                        className="relative bg-slate-900/95 backdrop-blur-xl border border-red-500/30 rounded-xl overflow-hidden shadow-2xl w-full max-w-md mx-4 animate-[fadeIn_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-500/10 rounded-lg">
                                    <Power className="text-red-400" size={24} />
                                </div>
                                <h3 className="text-lg font-serif text-slate-100">Restart Control Hub?</h3>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed mt-3">
                                This will restart the Control Hub. Automations, dashboards, and integrations will pause for a short time and then come back online.
                            </p>
                        </div>

                        {/* Footer with buttons */}
                        <div className="p-6 flex gap-3">
                            <button
                                onClick={() => setRestartConfirmOpen(false)}
                                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 font-medium transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRestartConfirm}
                                className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/70 rounded-lg text-red-400 font-medium transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <Power size={16} />
                                Restart Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedSettingsView;
