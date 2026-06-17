import React, { useCallback } from 'react';
import { Lock, Unlock, Battery, LogOut, CheckCircle, ShieldCheck } from 'lucide-react';
import Card from '../components/Card';
import CameraStream from '../components/CameraStream';
import { useHomeAssistant, useHassEntity } from '../context/HomeAssistantContext';
import estateEntities from '../config/estateEntities';
import useOptimisticValue from '../hooks/useOptimisticValue';

const MotionStatus = ({ motion }) => {
    const state = useHassEntity(motion.entity, { state: 'off' });

    return (
        <div className="bg-slate-950/50 p-3 rounded border border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-400">{motion.label}</span>
            <span className={`text-[10px] ${state.state === 'on' ? 'text-red-500' : 'text-emerald-500'}`}>
                {state.state === 'on' ? 'Detected' : 'Clear'}
            </span>
        </div>
    );
};

const SecurityView = ({ editMode = false, onCardEdit = null }) => {
    const { callService } = useHomeAssistant();
    const securityConfig = estateEntities.security;
    const lock = useHassEntity(securityConfig.lock, { state: 'locked' });
    const door = useHassEntity(securityConfig.door, { state: 'off' });
    const battery = useHassEntity(securityConfig.battery, { state: 100 });
    const securitySystem = useHassEntity(securityConfig.masterSwitch, { state: 'off' });
    const [isLocked, setOptimisticLocked, rollbackLocked] = useOptimisticValue(lock.state === 'locked');
    const [isSecurityArmed, setOptimisticSecurityArmed, rollbackSecurityArmed] = useOptimisticValue(securitySystem.state === 'on');

    const handleLockToggle = useCallback(() => {
        const nextLocked = !isLocked;
        setOptimisticLocked(nextLocked);
        callService('lock', nextLocked ? 'lock' : 'unlock', { entity_id: securityConfig.lock }).catch((error) => {
            console.warn('Failed to toggle main lock:', error);
            rollbackLocked();
        });
    }, [callService, isLocked, rollbackLocked, securityConfig.lock, setOptimisticLocked]);

    const handleSecurityToggle = useCallback(() => {
        const nextArmed = !isSecurityArmed;
        setOptimisticSecurityArmed(nextArmed);
        callService('input_boolean', nextArmed ? 'turn_on' : 'turn_off', { entity_id: securityConfig.masterSwitch }).catch((error) => {
            console.warn('Failed to toggle sentry system:', error);
            rollbackSecurityArmed();
        });
    }, [
        callService,
        isSecurityArmed,
        rollbackSecurityArmed,
        securityConfig.masterSwitch,
        setOptimisticSecurityArmed
    ]);

    return (
        <div className="space-y-6 animate-[fadeIn_0.8s_ease-out]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="Access Control" subtitle="Main Entrance" className="flex flex-col justify-between" editMode={editMode} onEditClick={onCardEdit} cardId="security-access-control">
                    {/* Lock Status Display */}
                    <div className="flex-1 flex flex-col items-center justify-center py-6">
                        <div
                            className="relative group cursor-pointer"
                            onClick={handleLockToggle}
                        >
                            {/* Animated Glow Ring */}
                            <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-700 ${isLocked ? 'bg-emerald-500/30 animate-[pulse_3s_ease-in-out_infinite]' : 'bg-red-500/30 animate-[pulse_2s_ease-in-out_infinite]'}`}></div>

                            {/* Main Lock Circle */}
                            <div className={`relative w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-700 group-hover:scale-105
                            ${isLocked
                                    ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]'
                                    : 'border-red-500/50 bg-gradient-to-br from-red-500/20 to-red-600/10 text-red-400 shadow-[0_0_40px_rgba(239,68,68,0.2)]'}`}
                            >
                                {isLocked ? <Lock size={40} className="transition-transform group-hover:scale-110 duration-300" /> : <Unlock size={40} className="transition-transform group-hover:scale-110 duration-300" />}
                            </div>
                        </div>

                        {/* Status Label */}
                        <div className={`mt-6 px-4 py-1.5 rounded-full border text-xs  tracking-widest transition-all duration-500
                        ${isLocked
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
                        >
                            {isLocked ? 'Secure' : 'Unlocked'}
                        </div>
                    </div>

                    {/* Info Pills */}
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800/50">
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/30 border border-slate-700/50 transition-all hover:border-slate-600/50">
                            <Battery size={16} className={parseInt(battery.state) < 20 ? 'text-red-400' : 'text-emerald-400'} />
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 tracking-wider">Battery</span>
                                <span className="text-xs  text-slate-200">{battery.state}%</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/30 border border-slate-700/50 transition-all hover:border-slate-600/50">
                            {door.state === 'on' ? <LogOut size={16} className="text-amber-400" /> : <CheckCircle size={16} className="text-emerald-400" />}
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 tracking-wider">Door</span>
                                <span className="text-xs  text-slate-200">{door.state === 'on' ? 'Open' : 'Closed'}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Perimeter Defense" subtitle="System Master" className="md:col-span-2 flex flex-col justify-center" editMode={editMode} onEditClick={onCardEdit} cardId="security-perimeter">
                    <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/50 mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isSecurityArmed ? 'bg-green-500/20 text-green-500' : 'bg-slate-700 text-slate-400'}`}>
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg  text-slate-200">Automated Sentry</h4>
                                <p className="text-xs text-slate-500 font-mono">Status: {isSecurityArmed ? 'ARMED' : 'DISARMED'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSecurityToggle}
                            className={`px-6 py-3 rounded  text-xs tracking-widest transition-all
                        ${isSecurityArmed ? 'bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white' : 'bg-green-500/20 text-green-500 border border-green-500/50 hover:bg-green-500 hover:text-white'}`}
                        >
                            {isSecurityArmed ? 'Disarm System' : 'Arm System'}
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {securityConfig.motion.map((motion) => (
                            <MotionStatus key={motion.entity} motion={motion} />
                        ))}
                    </div>
                </Card>
            </div>

            <h2 className="text-xl font-kumbh text-slate-300 border-b border-slate-800 pb-2 mt-8">Surveillance Matrix</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {securityConfig.cameras.map((camera) => (
                    <CameraStream key={camera.entityId} entityId={camera.entityId} name={camera.name} />
                ))}
            </div>
        </div>
    );
};

export default SecurityView;
