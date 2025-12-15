import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

const SystemLogsContent = ({ hassStates, debugMode }) => {
    const [logs, setLogs] = useState([]);
    const logsEndRef = useRef(null);
    const [autoScroll, setAutoScroll] = useState(true);

    useEffect(() => {
        // Simulate log entries from various HA entities and system events
        const generateLogs = () => {
            const newLogs = [];
            const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

            // Add connection status
            newLogs.push({
                time: timestamp,
                level: 'INFO',
                source: 'core',
                message: 'WebSocket connection established'
            });

            // Add entity state changes
            Object.entries(hassStates).forEach(([entityId, entity]) => {
                if (entity.last_changed) {
                    const lastChanged = new Date(entity.last_changed);
                    const timeDiff = Date.now() - lastChanged.getTime();

                    // Only show recent changes (last 5 minutes)
                    if (timeDiff < 300000) {
                        newLogs.push({
                            time: lastChanged.toLocaleTimeString('en-US', { hour12: false }),
                            level: 'DEBUG',
                            source: entityId.split('.')[0],
                            message: `${entityId} changed to ${entity.state}`
                        });
                    }
                }
            });

            // Add some system messages
            if (debugMode) {
                newLogs.push({
                    time: timestamp,
                    level: 'DEBUG',
                    source: 'frontend',
                    message: `Debug mode enabled - ${Object.keys(hassStates).length} entities loaded`
                });
            }

            // Sort by time and limit to last 100 entries
            return newLogs.slice(-100);
        };

        setLogs(generateLogs());

        // Update logs every 2 seconds
        const interval = setInterval(() => {
            setLogs(generateLogs());
        }, 2000);

        return () => clearInterval(interval);
    }, [hassStates, debugMode]);

    // Check if user is scrolled to bottom
    useEffect(() => {
        const container = document.getElementById('system-logs-container');
        if (!container) return;

        const handleScroll = () => {
            const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
            setAutoScroll(isAtBottom);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-scroll to bottom only if user hasn't scrolled up
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
            {logs.map((log, idx) => (
                <div key={idx} className="flex gap-3 hover:bg-slate-800/30 px-2 py-1 rounded transition-colors">
                    <span className="text-slate-600 shrink-0">{log.time}</span>
                    <span className={`${getLevelColor(log.level)}  shrink-0 w-12`}>{log.level}</span>
                    <span className="text-amber-500/60 shrink-0 w-20 truncate">[{log.source}]</span>
                    <span className="text-slate-300 break-all">{log.message}</span>
                </div>
            ))}
            <div ref={logsEndRef} />
        </div>
    );
};

export default SystemLogsContent;
