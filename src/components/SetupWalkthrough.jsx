import React, { useState } from 'react';
import {
    Sparkles, ShieldCheck, Zap, Palette, Wifi, Lock, BookOpen, AlertTriangle,
    LayoutDashboard, Activity, CloudRain, Home, Lightbulb, Thermometer, Tv, ChevronRight
} from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';
import * as storage from '../utils/storage';

/**
 * --- FIRST TIME SETUP: WALKTHROUGH/SETUP GUIDE ---
 */
const SetupWalkthrough = ({ onComplete }) => {
    const { colors } = useAccentColor();
    const [step, setStep] = useState(0);
    const [hubUrl, setHubUrl] = useState('');
    const [accessKey, setAccessKey] = useState('');

    const steps = [
        {
            title: "Welcome to Vœrynth Système",
            icon: Sparkles,
            description: "Your sophisticated command interface for intelligent estate management.",
            content: (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-amber-500/30 transition-all duration-500 group">
                            <div className={`w-16 h-16 rounded-xl ${colors.bgSoft} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500`}>
                                <ShieldCheck className={`${colors.text} w-8 h-8`} />
                            </div>
                            <h3 className="text-sm  text-slate-200 mb-2">Private & Secure</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">All data remains on your local network. No cloud dependencies.</p>
                        </div>

                        <div className="text-center p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-500 group">
                            <div className={`w-16 h-16 rounded-xl ${colors.bgSoft} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500`}>
                                <Zap className={`${colors.text} w-8 h-8`} />
                            </div>
                            <h3 className="text-sm  text-slate-200 mb-2">Real-Time Control</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">Instant response to every command. Seamless automation.</p>
                        </div>

                        <div className="text-center p-6 bg-slate-800/30 rounded-xl border border-slate-700/50 hover:border-blue-500/30 transition-all duration-500 group">
                            <div className={`w-16 h-16 rounded-xl ${colors.bgSoft} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-500`}>
                                <Palette className={`${colors.text} w-8 h-8`} />
                            </div>
                            <h3 className="text-sm  text-slate-200 mb-2">Elegant Design</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">Sophisticated, regal interface that feels alive.</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Connect to Control Hub",
            icon: Wifi,
            description: "Enter your Control Hub network address to establish a secure local connection.",
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Control Hub URL
                        </label>
                        <input
                            type="text"
                            value={hubUrl}
                            onChange={(e) => setHubUrl(e.target.value)}
                            placeholder="http://192.168.1.100:8123"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300"
                        />
                        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                            This is the local network address where your Control Hub is running. Typically starts with <span className="text-amber-400 font-mono">http://</span> followed by your local IP address and port.
                        </p>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${colors.bgSoft} flex items-center justify-center flex-shrink-0`}>
                                <ShieldCheck className={`${colors.text} w-5 h-5`} />
                            </div>
                            <div className="text-sm text-blue-300">
                                <p className="font-medium mb-1">Local Network Only</p>
                                <p className="text-blue-400/80 text-xs leading-relaxed">
                                    Your Control Hub URL should be accessible only within your local network. This ensures all communication stays private and secure within your estate.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-slate-300">Common Examples:</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {['http://192.168.1.100:8123', 'http://homeassistant.local:8123', 'http://10.0.0.50:8123'].map((example) => (
                                <button
                                    key={example}
                                    onClick={() => setHubUrl(example)}
                                    className="text-left px-4 py-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/30 rounded-lg text-xs text-slate-400 hover:text-amber-400 font-mono transition-all duration-300"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Access Key Configuration",
            icon: Lock,
            description: "Provide your Long-Lived Access Token for secure authentication.",
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <label className="block text-sm font-medium text-slate-300 mb-3">
                            Long-Lived Access Token
                        </label>
                        <input
                            type="password"
                            value={accessKey}
                            onChange={(e) => setAccessKey(e.target.value)}
                            placeholder="Enter your access token..."
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 font-mono text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                            This token authenticates Vœrynth OS with your Control Hub. It's stored securely in your browser and never transmitted outside your local network.
                        </p>
                    </div>

                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 space-y-4">
                        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                            <BookOpen className={`${colors.text} w-4 h-4`} />
                            How to Generate Your Access Token
                        </h4>
                        <ol className="space-y-3 text-sm text-slate-400">
                            <li className="flex items-start gap-3">
                                <span className={`${colors.text}  flex-shrink-0`}>1.</span>
                                <span>Open your Control Hub web interface in a browser</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className={`${colors.text}  flex-shrink-0`}>2.</span>
                                <span>Click on your profile name in the bottom-left corner</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className={`${colors.text}  flex-shrink-0`}>3.</span>
                                <span>Scroll down to "Long-Lived Access Tokens" section</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className={`${colors.text}  flex-shrink-0`}>4.</span>
                                <span>Click "Create Token", give it a name (e.g., "Vœrynth OS")</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className={`${colors.text}  flex-shrink-0`}>5.</span>
                                <span>Copy the generated token and paste it above</span>
                            </li>
                        </ol>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-amber-400 w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-300">
                                <p className="font-medium mb-1">Keep Your Token Secure</p>
                                <p className="text-amber-400/80 text-xs leading-relaxed">
                                    This token grants full access to your Control Hub. Never share it with anyone or post it online. Store it safely.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Explore the Dashboard",
            icon: LayoutDashboard,
            description: "Your command center for quick access to all estate systems.",
            content: (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-500 group">
                            <div className={`w-12 h-12 rounded-lg ${colors.bgSoft} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500`}>
                                <Activity className={`${colors.text} w-6 h-6`} />
                            </div>
                            <h4 className="text-sm  text-slate-200 mb-1">Real-Time Status</h4>
                            <p className="text-xs text-slate-400">Monitor all systems at a glance</p>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-500 group">
                            <div className={`w-12 h-12 rounded-lg ${colors.bgSoft} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500`}>
                                <Zap className={`${colors.text} w-6 h-6`} />
                            </div>
                            <h4 className="text-sm  text-slate-200 mb-1">Energy Flow</h4>
                            <p className="text-xs text-slate-400">Track consumption & production</p>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-purple-500/30 transition-all duration-500 group">
                            <div className={`w-12 h-12 rounded-lg ${colors.bgSoft} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500`}>
                                <CloudRain className={`${colors.text} w-6 h-6`} />
                            </div>
                            <h4 className="text-sm  text-slate-200 mb-1">Weather</h4>
                            <p className="text-xs text-slate-400">Local conditions & forecast</p>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-rose-500/30 transition-all duration-500 group">
                            <div className={`w-12 h-12 rounded-lg ${colors.bgSoft} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500`}>
                                <Wifi className={`${colors.text} w-6 h-6`} />
                            </div>
                            <h4 className="text-sm  text-slate-200 mb-1">Network</h4>
                            <p className="text-xs text-slate-400">Performance & connectivity</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Control Your Estate",
            icon: Home,
            description: "Manage every aspect of your property with elegant precision.",
            content: (
                <div className="space-y-4">
                    {[
                        { icon: Lightbulb, title: "Chambers", desc: "Control individual lights or entire rooms with a touch", color: "amber" },
                        { icon: Thermometer, title: "Climate", desc: "Adjust temperature and monitor environmental conditions", color: "emerald" },
                        { icon: ShieldCheck, title: "Security", desc: "Manage locks, cameras, and access control systems", color: "blue" },
                        { icon: Zap, title: "Energy", desc: "Track consumption, optimize usage, and monitor grid flow", color: "purple" },
                        { icon: Tv, title: "Entertainment", desc: "Control media players and entertainment systems", color: "rose" }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-amber-500/30 transition-all duration-500 group flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl ${colors.bgSoft} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                                <item.icon className={`${colors.text} w-7 h-7`} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm  text-slate-200 mb-1">{item.title}</h4>
                                <p className="text-xs text-slate-400">{item.desc}</p>
                            </div>
                            <ChevronRight className={`text-slate-600 w-5 h-5 group-hover:${colors.text} group-hover:translate-x-1 transition-all duration-300`} />
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: "Customize Your Experience",
            icon: Palette,
            description: "Tailor Vœrynth OS to match your refined taste and preferences.",
            content: (
                <div className="space-y-6">
                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <h4 className="text-sm font-medium text-slate-300 mb-4">Accent Colors</h4>
                        <div className="flex gap-3 justify-center">
                            {[
                                { name: 'Amber', color: 'bg-amber-500' },
                                { name: 'Emerald', color: 'bg-emerald-500' },
                                { name: 'Blue', color: 'bg-blue-500' },
                                { name: 'Purple', color: 'bg-purple-500' },
                                { name: 'Rose', color: 'bg-rose-500' }
                            ].map((color) => (
                                <div key={color.name} className="text-center group cursor-pointer">
                                    <div className={`w-12 h-12 rounded-xl ${color.color} mb-2 group-hover:scale-110 transition-transform duration-300 shadow-lg`}></div>
                                    <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">{color.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                            <h4 className="text-sm  text-slate-200 mb-2">Animation Speed</h4>
                            <p className="text-xs text-slate-400">Adjust interface fluidity</p>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
                            <h4 className="text-sm  text-slate-200 mb-2">Particle Effects</h4>
                            <p className="text-xs text-slate-400">Control visual richness</p>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <p className="text-sm text-blue-300 text-center">
                            All preferences are saved locally in your browser and persist across sessions.
                        </p>
                    </div>
                </div>
            )
        }
    ];

    const currentStep = steps[step];
    const StepIcon = currentStep.icon;

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex items-center justify-center overflow-y-auto">
            {/* Splash-style background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${colors.bgSoft} rounded-full blur-[150px] animate-[pulse_4s_ease-in-out_infinite]`}></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-[150px] animate-[pulse_5s_ease-in-out_infinite_1s]"></div>
                <div className="absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 50% 50%, rgba(${colors.rgb}, 0.05), transparent 70%)` }}></div>
            </div>

            <div className="relative z-10 max-w-3xl w-full px-6 py-8 my-auto font-kumbh">
                <div className="text-center mb-8 animate-[fadeIn_0.6s_ease-out]">
                    <h1 className="font-kumbh text-3xl font-semibold text-slate-100 tracking-[0.15em] mb-2">
                        Setup Guide
                    </h1>
                    <p className="text-sm text-slate-400">Step {step + 1} of {steps.length}</p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-2xl p-8 mb-6 animate-[fadeIn_0.8s_ease-out] shadow-2xl">
                    <div className="text-center mb-8">
                        <div className={`w-20 h-20 rounded-2xl ${colors.bgSoft} flex items-center justify-center mx-auto mb-4 animate-[float_3s_ease-in-out_infinite]`}>
                            <StepIcon className={`${colors.text} w-10 h-10 ${colors.glow}`} />
                        </div>
                        <h2 className="text-2xl font-serif text-slate-100 mb-3">{currentStep.title}</h2>
                        <p className="text-slate-300 leading-relaxed">{currentStep.description}</p>
                    </div>

                    {/* Dynamic content */}
                    <div className="animate-[fadeIn_1s_ease-out]">
                        {currentStep.content}
                    </div>
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mb-6 animate-[fadeIn_1s_ease-out]">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 rounded-full transition-all duration-500 ${idx === step
                                    ? `${colors.bgSolid} w-8 shadow-lg ${colors.shadow}`
                                    : idx < step
                                        ? `${colors.bgSolid}/50 w-2`
                                        : 'bg-slate-700 w-2'
                                }`}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex gap-4 animate-[fadeIn_1.2s_ease-out]">
                    {step > 0 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="w-32 py-4 rounded-xl bg-slate-800/80 backdrop-blur text-slate-300  tracking-wider hover:bg-slate-700 hover:scale-[1.02] transition-all duration-300 border border-slate-700/50"
                        >
                            ← PREVIOUS
                        </button>
                    )}
                    {step < steps.length - 1 ? (
                        <button
                            onClick={async () => {
                                // Save URL and token when moving past those steps
                                if (step === 1 && hubUrl) {
                                    await storage.setItem('voerynth_ha_url', hubUrl);
                                }
                                if (step === 2 && accessKey) {
                                    await storage.setItem('voerynth_ha_token', accessKey);
                                }
                                setStep(step + 1);
                            }}
                            className={`flex-1 py-4 rounded-xl ${colors.bgSolid} text-slate-950  tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg ${colors.shadow}`}
                        >
                            NEXT →
                        </button>
                    ) : (
                        <button
                            onClick={async () => {
                                // Save credentials before completing
                                if (hubUrl) await storage.setItem('voerynth_ha_url', hubUrl);
                                if (accessKey) await storage.setItem('voerynth_ha_token', accessKey);
                                onComplete();
                            }}
                            className={`flex-1 py-4 rounded-xl ${colors.bgSolid} text-slate-950  tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg ${colors.shadow} animate-pulse`}
                        >
                            START USING VŒRYNTH OS
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SetupWalkthrough;
