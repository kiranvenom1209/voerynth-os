import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Power, Mic, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Grid, Tv } from 'lucide-react';
import Card from '../components/Card';
import { useHomeAssistant, useHassEntity } from '../context/HomeAssistantContext';
import BrandIcon from '../components/BrandIcon';
import estateEntities from '../config/estateEntities';
import useOptimisticValue from '../hooks/useOptimisticValue';

const formatMediaTime = (seconds) => {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const MediaView = ({ editMode = false, onCardEdit = null }) => {
    const { callService } = useHomeAssistant();
    const mediaConfig = estateEntities.media;
    const powerSwitch = useHassEntity(mediaConfig.powerSwitch, { state: 'off' });
    const media = useHassEntity(mediaConfig.player, {
        state: 'idle',
        attributes: {
            app_name: '',
            media_title: '',
            media_artist: '',
            media_series_title: '',
            media_duration: 0,
            media_position: 0,
        },
    });

    const appName = media.attributes.app_name || 'Android TV';
    const mediaTitle =
        media.attributes.media_title ||
        media.attributes.media_series_title ||
        (media.state === 'playing' ? 'Streaming…' : 'Nothing playing');
    const mediaSubtitle =
        media.attributes.media_artist ||
        (media.state && media.state !== 'idle' ? media.state.charAt(0).toUpperCase() + media.state.slice(1) : 'Idle');

    const duration = Number(media.attributes.media_duration || 0);
    const position = Number(media.attributes.media_position || 0);
    const progress = duration > 0 ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;

    const isPlaying = media.state === 'playing';
    const isPaused = media.state === 'paused';
    const [isPowered, setOptimisticPowered, rollbackPowered] = useOptimisticValue(powerSwitch.state === 'on');
    const [activeRemoteCommand, setActiveRemoteCommand] = useState(null);
    const [launchingApp, setLaunchingApp] = useState(null);
    const remoteFeedbackTimerRef = useRef(null);
    const launchFeedbackTimerRef = useRef(null);

    useEffect(() => () => {
        if (remoteFeedbackTimerRef.current) {
            window.clearTimeout(remoteFeedbackTimerRef.current);
        }
        if (launchFeedbackTimerRef.current) {
            window.clearTimeout(launchFeedbackTimerRef.current);
        }
    }, []);

    const handlePowerToggle = useCallback(() => {
        const nextPowered = !isPowered;
        setOptimisticPowered(nextPowered);
        callService('switch', nextPowered ? 'turn_on' : 'turn_off', { entity_id: mediaConfig.powerSwitch }).catch((error) => {
            console.warn('Failed to toggle entertainment power:', error);
            rollbackPowered();
        });
    }, [
        callService,
        isPowered,
        mediaConfig.powerSwitch,
        rollbackPowered,
        setOptimisticPowered
    ]);

    const showRemoteFeedback = useCallback((command) => {
        setActiveRemoteCommand(command);
        if (remoteFeedbackTimerRef.current) {
            window.clearTimeout(remoteFeedbackTimerRef.current);
        }
        remoteFeedbackTimerRef.current = window.setTimeout(() => {
            setActiveRemoteCommand(null);
            remoteFeedbackTimerRef.current = null;
        }, 220);
    }, []);

    const sendRemoteCommand = useCallback((command) => {
        showRemoteFeedback(command);
        callService('remote', 'send_command', { entity_id: mediaConfig.remote, command }).catch((error) => {
            console.warn('Failed to send media remote command:', error);
            setActiveRemoteCommand(null);
        });
    }, [callService, mediaConfig.remote, showRemoteFeedback]);

    const launchApp = useCallback((app) => {
        setLaunchingApp(app.name);
        if (launchFeedbackTimerRef.current) {
            window.clearTimeout(launchFeedbackTimerRef.current);
        }
        launchFeedbackTimerRef.current = window.setTimeout(() => {
            setLaunchingApp(null);
            launchFeedbackTimerRef.current = null;
        }, 900);

        callService('script', 'turn_on', { entity_id: app.script }).catch((error) => {
            console.warn('Failed to launch media app:', error);
            setLaunchingApp(null);
        });
    }, [callService]);

    const statusPillClasses = isPlaying
        ? 'bg-emerald-500/15 text-emerald-400'
        : isPaused
            ? 'bg-amber-500/15 text-amber-400'
            : 'bg-slate-800/80 text-slate-400';

    const appNameNorm = appName.toLowerCase();
    let appIconName = null;

    // Map app names to brand icons
    if (appNameNorm.includes('netflix')) {
        appIconName = 'netflix';
    } else if (appNameNorm.includes('youtube')) {
        appIconName = 'youtube';
    } else if (appNameNorm.includes('spotify')) {
        appIconName = 'spotify';
    } else if (appNameNorm.includes('prime') || appNameNorm.includes('video')) {
        appIconName = 'prime-video';
    } else if (appNameNorm.includes('disney')) {
        appIconName = 'disney-plus';
    } else if (appNameNorm.includes('hulu')) {
        appIconName = 'hulu';
    } else if (appNameNorm.includes('hbo') || appNameNorm.includes('max')) {
        appIconName = 'max';
    } else if (appNameNorm.includes('apple tv')) {
        appIconName = 'apple-tv';
    } else if (appNameNorm.includes('plex')) {
        appIconName = 'plex';
    } else if (appNameNorm.includes('jellyfin')) {
        appIconName = 'jellyfin';
    } else if (appNameNorm.includes('emby')) {
        appIconName = 'emby';
    } else if (appNameNorm.includes('twitch')) {
        appIconName = 'twitch';
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full animate-[slideUpFade_0.6s_ease-out_forwards] content-start lg:content-center pt-4 lg:pt-0">
            {/* Android TV Remote Replica */}
            <div className="flex items-center justify-center">
                <div className="w-64 bg-slate-900 rounded-[3rem] border border-slate-700 p-6 shadow-2xl relative">
                    <div className="flex justify-between mb-8 px-2">
                        <button
                            onClick={handlePowerToggle}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPowered ? 'bg-red-500/20 text-red-400 shadow-[0_0_16px_rgba(239,68,68,0.18)]' : 'bg-slate-800 text-red-500 hover:bg-red-500/20'}`}
                        >
                            <Power size={16} />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition-colors">
                            <Mic size={16} />
                        </button>
                    </div>

                    {/* D-Pad */}
                    <div className="relative w-48 h-48 mx-auto mb-8 bg-slate-800/50 rounded-full border border-slate-700 flex items-center justify-center">
                        <button
                            onClick={() => sendRemoteCommand('DPAD_UP')}
                            className={`absolute top-2 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center rounded-full transition-colors ${activeRemoteCommand === 'DPAD_UP' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ArrowUp size={24} />
                        </button>
                        <button
                            onClick={() => sendRemoteCommand('DPAD_DOWN')}
                            className={`absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 flex items-center justify-center rounded-full transition-colors ${activeRemoteCommand === 'DPAD_DOWN' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ArrowDown size={24} />
                        </button>
                        <button
                            onClick={() => sendRemoteCommand('DPAD_LEFT')}
                            className={`absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full transition-colors ${activeRemoteCommand === 'DPAD_LEFT' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <button
                            onClick={() => sendRemoteCommand('DPAD_RIGHT')}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full transition-colors ${activeRemoteCommand === 'DPAD_RIGHT' ? 'text-white bg-white/10' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <ArrowRight size={24} />
                        </button>
                        <button
                            type="button"
                            onClick={() => sendRemoteCommand('DPAD_CENTER')}
                            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner text-xs tracking-widest transition-colors cursor-pointer ${activeRemoteCommand === 'DPAD_CENTER' ? 'bg-amber-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-amber-500 hover:text-slate-900'}`}
                        >
                            OK
                        </button>
                    </div>

                    <div className="flex justify-around mb-8 px-4 text-slate-400">
                        <button
                            onClick={() => sendRemoteCommand('BACK')}
                            className={`transition-colors ${activeRemoteCommand === 'BACK' ? 'text-white' : 'hover:text-white'}`}
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <button
                            onClick={() => sendRemoteCommand('HOME')}
                            className={`transition-colors ${activeRemoteCommand === 'HOME' ? 'text-white' : 'hover:text-white'}`}
                        >
                            <Grid size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* App Launcher Grid & Now Playing */}
            <div className="flex flex-col justify-center space-y-6">
                <Card title="Now Playing" subtitle={appName} editMode={editMode} onEditClick={onCardEdit} cardId="media-now-playing">
                    <div className="relative overflow-hidden rounded-xl">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent" />
                        {isPlaying && (
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-60 animate-[shimmer_3s_linear_infinite]" />
                        )}
                        <div className="relative z-10 flex items-center gap-4 p-3">
                            <div className="w-14 h-14 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-center overflow-hidden">
                                {appIconName ? (
                                    <BrandIcon name={appIconName} size={28} className="text-slate-300" />
                                ) : (
                                    <Tv className="w-7 h-7 text-slate-500" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className="text-sm font-semibold text-slate-100 truncate">{mediaTitle}</div>
                                    <span className={`text-[9px]  tracking-widest px-2 py-0.5 rounded-full ${statusPillClasses}`}>
                                        {media.state ? media.state.charAt(0).toUpperCase() + media.state.slice(1) : 'Idle'}
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">{mediaSubtitle}</div>
                                <div className="mt-3">
                                    <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden relative">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                        {isPlaying && (
                                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-40 animate-[shimmer_2.5s_linear_infinite]" />
                                        )}
                                    </div>
                                    <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                                        <span>{formatMediaTime(position)}</span>
                                        <span>{duration ? formatMediaTime(duration) : ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Quick Launch" subtitle="Shield TV Apps" editMode={editMode} onEditClick={onCardEdit} cardId="media-quick-launch">
                    <div className="grid grid-cols-2 gap-4">
                        {mediaConfig.launchApps.map((app) => (
                            <button
                                key={app.name}
                                onClick={() => launchApp(app)}
                                className={`${app.color} bg-opacity-20 border border-white/10 hover:bg-opacity-40 h-28 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group hover:scale-105 active:scale-95 ${launchingApp === app.name ? 'scale-[1.02] border-white/30 bg-opacity-40 shadow-[0_0_24px_rgba(255,255,255,0.08)]' : ''}`}
                            >
                                <div className={`group-hover:scale-110 transition-transform ${launchingApp === app.name ? 'scale-110' : ''}`}>
                                    <BrandIcon name={app.icon} size={48} className="text-slate-100" />
                                </div>
                                <span className="font-kumbh text-xs text-slate-100 tracking-widest">{app.name}</span>
                            </button>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default MediaView;
