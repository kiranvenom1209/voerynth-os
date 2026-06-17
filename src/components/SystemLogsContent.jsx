import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useHomeAssistant } from '../context/HomeAssistantContext';
import haClient from '../services/haClient';

const MAX_LOGS = 200;

const formatTime = (value = new Date()) => new Date(value).toLocaleTimeString('en-US', { hour12: false });

const normalizeSystemLogEvent = (message) => {
    const event = message?.event || message;
    const data = event?.data || {};

    return {
        time: formatTime(event?.time_fired || data.timestamp),
        level: (data.level || data.levelname || 'INFO').toUpperCase(),
        source: data.name || data.source || data.logger || 'system',
        message: data.message || data.exception || JSON.stringify(data)
    };
};

const SystemLogsContent = ({ hassStates, debugMode }) => {
    const [logs, setLogs] = useState([]);
    const logsEndRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const { connectionStatus, getHAConnection } = useHomeAssistant();
    const getHAConnectionRef = useRef(getHAConnection);
    const previousStatesRef = useRef(null);
    const nextLogIdRef = useRef(1);

    useEffect(() => {
        getHAConnectionRef.current = getHAConnection;
    }, [getHAConnection]);

    const appendLog = useCallback((entry) => {
        setLogs((currentLogs) => [
            ...currentLogs,
            {
                id: nextLogIdRef.current++,
                time: entry.time || formatTime(),
                level: entry.level || 'INFO',
                source: entry.source || 'frontend',
                message: entry.message || ''
            }
        ].slice(-MAX_LOGS));
    }, []);

    useEffect(() => {
        if (connectionStatus !== 'connected') {
            appendLog({
                level: 'WARN',
                source: 'frontend',
                message: 'Waiting for Home Assistant connection'
            });
            return undefined;
        }

        let cancelled = false;
        let unsubscribeSystemLogs = null;

        const subscribeToSystemLogs = async () => {
            const haConnection = getHAConnectionRef.current?.();
            if (!haConnection?.connected) return;

            haClient.setHAConnection(haConnection);

            try {
                unsubscribeSystemLogs = await haClient.subscribeWS(
                    'subscribe_events',
                    { event_type: 'system_log_event' },
                    (message) => {
                        if (!cancelled) {
                            appendLog(normalizeSystemLogEvent(message));
                        }
                    }
                );

                if (!cancelled) {
                    appendLog({
                        level: 'INFO',
                        source: 'core',
                        message: 'Subscribed to Home Assistant system log events'
                    });
                }
            } catch (err) {
                if (!cancelled) {
                    appendLog({
                        level: 'WARN',
                        source: 'system_log',
                        message: err.message || 'System log event stream is unavailable'
                    });
                }
            }
        };

        subscribeToSystemLogs();

        return () => {
            cancelled = true;
            if (typeof unsubscribeSystemLogs === 'function') {
                unsubscribeSystemLogs();
            }
        };
    }, [appendLog, connectionStatus]);

    useEffect(() => {
        const entries = Object.entries(hassStates || {});
        const previousStates = previousStatesRef.current;

        if (!previousStates) {
            previousStatesRef.current = new Map(entries.map(([entityId, entity]) => [entityId, entity?.state]));

            if (entries.length > 0) {
                appendLog({
                    level: 'INFO',
                    source: 'frontend',
                    message: `Tracking ${entries.length} Home Assistant entities`
                });
            }
            return;
        }

        if (debugMode) {
            entries.forEach(([entityId, entity]) => {
                const previousState = previousStates.get(entityId);
                if (previousState !== undefined && previousState !== entity?.state) {
                    appendLog({
                        time: formatTime(entity?.last_changed || entity?.last_updated),
                        level: 'DEBUG',
                        source: entityId.split('.')[0],
                        message: `${entityId} changed from ${previousState} to ${entity?.state}`
                    });
                }
            });
        }

        previousStatesRef.current = new Map(entries.map(([entityId, entity]) => [entityId, entity?.state]));
    }, [appendLog, debugMode, hassStates]);

    useEffect(() => {
        const container = document.getElementById('system-logs-container');
        if (!container) return undefined;

        const handleScroll = () => {
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
            setAutoScroll(isAtBottom);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (autoScroll) {
            const container = document.getElementById('system-logs-container');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [logs, autoScroll]);

    const getLevelColor = (level) => {
        switch (level) {
            case 'ERROR': return 'text-red-400';
            case 'WARNING':
            case 'WARN': return 'text-amber-400';
            case 'INFO': return 'text-blue-400';
            case 'DEBUG': return 'text-slate-500';
            default: return 'text-slate-400';
        }
    };

    if (logs.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 opacity-50" />
                    <p>Waiting for system events...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            {logs.map((log) => (
                <div key={log.id} className="flex gap-3 hover:bg-slate-800/30 px-2 py-1 rounded transition-colors">
                    <span className="text-slate-600 shrink-0">{log.time}</span>
                    <span className={`${getLevelColor(log.level)} shrink-0 w-16`}>{log.level}</span>
                    <span className="text-amber-500/60 shrink-0 w-24 truncate">[{log.source}]</span>
                    <span className="text-slate-300 break-all">{log.message}</span>
                </div>
            ))}
            <div ref={logsEndRef} />
        </div>
    );
};

export default SystemLogsContent;
