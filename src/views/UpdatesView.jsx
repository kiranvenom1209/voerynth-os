import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Activity, ShieldCheck, Cpu, Wifi, Settings, Music, RefreshCw, AlertTriangle, Download, CheckCircle, X } from 'lucide-react';
import Card from '../components/Card';
import { useHomeAssistant } from '../context/HomeAssistantContext';
import { useAccentColor } from '../context/AccentColorContext';
import CompanyLogo from '../components/CompanyLogo';
import { useEntity } from '../hooks/useEntity';

const UpdatesView = ({ editMode = false, onCardEdit = null }) => {
    const { hassStates, callService } = useHomeAssistant();
    const { colors } = useAccentColor();
    const [updatingEntities, setUpdatingEntities] = useState({});
    const [updateErrors, setUpdateErrors] = useState({});
    const [showVoerynthModal, setShowVoerynthModal] = useState(false);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (showVoerynthModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [showVoerynthModal]);

    // Dynamically categorize all update entities from Control Hub
    const categorizedUpdates = useMemo(() => {
        const categories = {
            system: [],
            addons: [],
            esphome: [],
            other: []
        };

        if (!hassStates) return categories;

        // Get all update entities
        const updateEntities = Object.keys(hassStates)
            .filter(entityId => entityId.startsWith('update.'))
            .map(entityId => {
                const entity = hassStates[entityId];
                let friendlyName = entity?.attributes?.friendly_name || entityId.replace('update.', '').replace(/_/g, ' ');

                // Replace "Home Assistant" with "Control Hub" in display names
                friendlyName = friendlyName
                    .replace(/Home Assistant Core/gi, 'Control Hub Core')
                    .replace(/Home Assistant Supervisor/gi, 'Control Hub Supervisor')
                    .replace(/Home Assistant Operating System/gi, 'Control Hub Operating System')
                    .replace(/Home Assistant/gi, 'Control Hub');

                return {
                    id: entityId,
                    name: friendlyName,
                    entity: entity,
                    entityIdLower: entityId.toLowerCase(),
                    nameLower: friendlyName.toLowerCase()
                };
            });

        // Categorize and assign icons
        updateEntities.forEach(update => {
            const { id, name, entityIdLower, nameLower } = update;

            // System updates (Control Hub core components)
            if (entityIdLower.includes('home_assistant_core') ||
                entityIdLower.includes('home_assistant_supervisor') ||
                entityIdLower.includes('home_assistant_operating_system') ||
                nameLower.includes('home assistant core') ||
                nameLower.includes('control hub core') ||
                nameLower.includes('supervisor') ||
                nameLower.includes('operating system')) {
                categories.system.push({
                    id,
                    name,
                    icon: Activity,
                    priority: entityIdLower.includes('core') ? 1 : entityIdLower.includes('supervisor') ? 2 : 3
                });
            }
            // ESPHome device firmware updates
            else if (entityIdLower.includes('firmware') ||
                nameLower.includes('firmware') ||
                entityIdLower.includes('esphome') && !entityIdLower.includes('_update')) {
                categories.esphome.push({
                    id,
                    name,
                    icon: Cpu,
                    priority: 99
                });
            }
            // Add-on updates (everything else that's not firmware)
            else {
                // Assign appropriate icons based on add-on type
                let icon = Settings;
                if (nameLower.includes('zigbee') || nameLower.includes('matter') || nameLower.includes('z-wave')) {
                    icon = Wifi;
                } else if (nameLower.includes('music') || nameLower.includes('media')) {
                    icon = Music;
                } else if (nameLower.includes('code') || nameLower.includes('editor')) {
                    icon = Settings;
                } else if (nameLower.includes('esphome')) {
                    icon = Cpu;
                }

                categories.addons.push({
                    id,
                    name,
                    icon,
                    priority: 99
                });
            }
        });

        // Sort each category alphabetically by name, with priority items first
        Object.keys(categories).forEach(category => {
            categories[category].sort((a, b) => {
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }
                return a.name.localeCompare(b.name);
            });
        });

        return categories;
    }, [hassStates]);

    const handleInstallUpdate = async (entityId, entityName, entity) => {
        // Check if update is already in progress (from HA state)
        if (entity.attributes.in_progress) {
            console.log(`Update already in progress for ${entityName}, skipping...`);
            return;
        }

        // Check if already updating in local state
        if (updatingEntities[entityId]) {
            console.log(`Update already triggered for ${entityName}, skipping...`);
            return;
        }

        // Mark as updating
        setUpdatingEntities(prev => ({ ...prev, [entityId]: true }));
        setUpdateErrors(prev => ({ ...prev, [entityId]: null }));

        try {
            // Check if this is a system update (supports backup)
            const isSystemUpdate = categorizedUpdates.system.some(u => u.id === entityId);
            const supportsBackup = entity.attributes?.supports_backup !== false && isSystemUpdate;

            // Build service data
            const serviceData = {
                entity_id: entityId
            };

            // Only add backup parameter for updates that support it (system updates)
            if (supportsBackup) {
                serviceData.backup = true;
            }

            // Call the update.install service for this specific entity
            await callService('update', 'install', serviceData);

            // Clear local updating state after service call succeeds
            // The entity's in_progress attribute will now be true from HA
            setUpdatingEntities(prev => ({ ...prev, [entityId]: false }));
        } catch (error) {
            console.error(`Failed to install update for ${entityName}:`, error);
            setUpdateErrors(prev => ({
                ...prev,
                [entityId]: error.message || 'Update failed. Please try again.'
            }));
            setUpdatingEntities(prev => ({ ...prev, [entityId]: false }));
        }
    };

    return (
        <div className="space-y-8 animate-[fadeIn_0.8s_ease-out]">
            {/* VŒRYNTH OS Update Button */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-2">
                <div>
                    <h2 className="text-3xl font-serif text-slate-200">Updates</h2>
                    <p className="text-sm text-slate-500 mt-1">System, add-ons, and device firmware</p>
                </div>
                <button
                    onClick={() => setShowVoerynthModal(true)}
                    className={`w-full sm:w-auto flex items-center gap-3 px-5 py-3 rounded-lg border ${colors.borderSoft} ${colors.bg} hover:${colors.bgHover} transition-all duration-300 active:scale-95 group`}
                >
                    <div className={`w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center ${colors.text400}`}>
                        <Activity size={20} />
                    </div>
                    <div className="text-left leading-tight">
                        <div className="text-xs sm:text-sm text-slate-200 tracking-wide">VŒRYNTH OS</div>
                        <div className="text-[11px] sm:text-xs text-slate-500">Check for updates</div>
                    </div>
                </button>
            </div>

            {/* VŒRYNTH OS Update Modal */}
            {showVoerynthModal && createPortal(
                <div
                    className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-950/80 backdrop-blur-md animate-[fadeIn_0.3s_ease-out] p-4 overflow-y-auto"
                    onClick={() => setShowVoerynthModal(false)}
                >
                    <div
                        className="relative w-full max-w-lg mt-20 animate-[slideUp_0.4s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`bg-slate-900/95 backdrop-blur-xl rounded-2xl border ${colors.borderSoft} shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}>
                            {/* Header */}
                            <div className={`${colors.bg} border-b ${colors.borderSoft} px-4 py-4`}>
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center p-2.5 ${colors.text400}`}>
                                            <CompanyLogo className="w-full h-full" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-serif text-slate-200 leading-snug">VŒRYNTH OS</h3>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Château Command Interface</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowVoerynthModal(false)}
                                        className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 hover:bg-slate-800/50 rounded-lg flex items-center justify-center"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="px-5 py-6 space-y-5 overflow-y-auto">
                                {/* Success Icon */}
                                <div className="flex justify-center">
                                    <div className={`w-16 h-16 rounded-full ${colors.bg} flex items-center justify-center`}>
                                        <CheckCircle size={32} className="text-emerald-400" />
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="text-center space-y-2">
                                    <h4 className="text-xl font-serif text-slate-200">You're Up to Date</h4>
                                    <p className="text-slate-400 text-sm max-w-md mx-auto">
                                        VŒRYNTH OS is running the latest version
                                    </p>
                                </div>

                                {/* Version Info */}
                                <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400">Current Version</span>
                                        <span className={`text-xs ${colors.text400}`}>5.0.2</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400">Release Date</span>
                                        <span className="text-xs text-slate-300">March 4, 2026</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-400">Build</span>
                                        <span className="text-xs text-slate-300">Stable</span>
                                    </div>
                                </div>

                                {/* Info Note */}
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-3">
                                    <AlertTriangle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-xs text-blue-300">
                                        <p className="font-medium mb-1">Automatic Updates</p>
                                        <p className="text-blue-400/80">
                                            VŒRYNTH OS will automatically check for updates. You'll be notified when a new version is available.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-4 bg-slate-800/30 border-t border-slate-700/50 flex justify-center">
                                <button
                                    onClick={() => setShowVoerynthModal(false)}
                                    className={`px-5 py-2.5 rounded-lg ${colors.bg} ${colors.text400} hover:${colors.bgHover} border ${colors.borderSoft} font-medium transition-all duration-300 active:scale-95 text-sm`}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* System Updates */}
            {categorizedUpdates.system.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-serif text-slate-200 px-2">System Updates</h2>
                        <p className="text-sm text-slate-500 px-2 mt-1">Control Hub core components</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categorizedUpdates.system.map((update, idx) => {
                            const entity = useEntity(hassStates, update.id, { state: 'off', attributes: { latest_version: 'N/A', installed_version: 'N/A', in_progress: false } });
                            const hasUpdate = entity.state === 'on';
                            const isUpdating = updatingEntities[update.id] || entity.attributes.in_progress;
                            const updateError = updateErrors[update.id];
                            const Icon = update.icon;

                            return (
                                <Card
                                    key={update.id}
                                    delay={idx * 50}
                                    className={`transition-all duration-500 ${hasUpdate ? 'border-amber-500/30 shadow-[0_0_20px_-5px_rgba(251,191,36,0.2)]' : ''
                                        } ${isUpdating ? 'border-blue-500/30 shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)]' : ''}`}
                                    editMode={editMode}
                                    onEditClick={onCardEdit}
                                    cardId={`update-system-${update.id}`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 ${isUpdating ? 'bg-blue-500/20 text-blue-400' :
                                                hasUpdate ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-slate-800 text-slate-500'
                                                }`}>
                                                {isUpdating ? (
                                                    <RefreshCw size={18} className="animate-spin" />
                                                ) : (
                                                    <Icon size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-200">{update.name}</div>
                                                <div className="text-[10px] text-slate-500 tracking-wider">
                                                    {entity.attributes.installed_version || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        {hasUpdate && !isUpdating && (
                                            <button
                                                onClick={() => handleInstallUpdate(update.id, update.name, entity)}
                                                disabled={isUpdating}
                                                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors p-2 hover:bg-amber-500/10 rounded-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={`Install update for ${update.name}`}
                                            >
                                                <Download size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {isUpdating && (
                                        <div className="text-xs text-blue-400/80 bg-blue-500/10 px-2 py-1 rounded flex items-center gap-2">
                                            <RefreshCw size={12} className="animate-spin" />
                                            Installing update...
                                        </div>
                                    )}

                                    {updateError && (
                                        <div className="text-xs text-red-400/80 bg-red-500/10 px-2 py-1 rounded flex items-center gap-2">
                                            <AlertTriangle size={12} />
                                            {updateError}
                                        </div>
                                    )}

                                    {hasUpdate && !isUpdating && !updateError && (
                                        <div className="text-xs text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded">
                                            Update available: {entity.attributes.latest_version}
                                        </div>
                                    )}

                                    {!hasUpdate && !isUpdating && !updateError && (
                                        <div className="text-xs text-emerald-500/80 flex items-center gap-1">
                                            <CheckCircle size={12} /> Up to date
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add-on Updates */}
            {categorizedUpdates.addons.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-serif text-slate-200 px-2">Add-on Updates</h2>
                        <p className="text-sm text-slate-500 px-2 mt-1">Control Hub add-ons and integrations</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categorizedUpdates.addons.map((update, idx) => {
                            const entity = useEntity(hassStates, update.id, { state: 'off', attributes: { latest_version: 'N/A', installed_version: 'N/A', in_progress: false } });
                            const hasUpdate = entity.state === 'on';
                            const isUpdating = updatingEntities[update.id] || entity.attributes.in_progress;
                            const updateError = updateErrors[update.id];
                            const Icon = update.icon;

                            return (
                                <Card
                                    key={update.id}
                                    delay={(categorizedUpdates.system.length + idx) * 50}
                                    className={`transition-all duration-500 ${hasUpdate ? 'border-amber-500/30 shadow-[0_0_20px_-5px_rgba(251,191,36,0.2)]' : ''
                                        } ${isUpdating ? 'border-blue-500/30 shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)]' : ''}`}
                                    editMode={editMode}
                                    onEditClick={onCardEdit}
                                    cardId={`update-addon-${update.id}`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 ${isUpdating ? 'bg-blue-500/20 text-blue-400' :
                                                hasUpdate ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-slate-800 text-slate-500'
                                                }`}>
                                                {isUpdating ? (
                                                    <RefreshCw size={18} className="animate-spin" />
                                                ) : (
                                                    <Icon size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-200">{update.name}</div>
                                                <div className="text-[10px] text-slate-500 tracking-wider">
                                                    {entity.attributes.installed_version || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        {hasUpdate && !isUpdating && (
                                            <button
                                                onClick={() => handleInstallUpdate(update.id, update.name, entity)}
                                                disabled={isUpdating}
                                                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors p-2 hover:bg-amber-500/10 rounded-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={`Install update for ${update.name}`}
                                            >
                                                <Download size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {isUpdating && (
                                        <div className="text-xs text-blue-400/80 bg-blue-500/10 px-2 py-1 rounded flex items-center gap-2">
                                            <RefreshCw size={12} className="animate-spin" />
                                            Installing update...
                                        </div>
                                    )}

                                    {updateError && (
                                        <div className="text-xs text-red-400/80 bg-red-500/10 px-2 py-1 rounded flex items-center gap-2">
                                            <AlertTriangle size={12} />
                                            {updateError}
                                        </div>
                                    )}

                                    {hasUpdate && !isUpdating && !updateError && (
                                        <div className="text-xs text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded">
                                            Update available: {entity.attributes.latest_version}
                                        </div>
                                    )}

                                    {!hasUpdate && !isUpdating && !updateError && (
                                        <div className="text-xs text-emerald-500/80 flex items-center gap-1">
                                            <CheckCircle size={12} /> Up to date
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ESPHome Device Firmware Updates */}
            {categorizedUpdates.esphome.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-serif text-slate-200 px-2">ESPHome Device Firmware</h2>
                        <p className="text-sm text-slate-500 px-2 mt-1">Firmware updates for ESPHome devices</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categorizedUpdates.esphome.map((update, idx) => {
                            const entity = useEntity(hassStates, update.id, { state: 'off', attributes: { latest_version: 'N/A', installed_version: 'N/A', in_progress: false } });
                            const hasUpdate = entity.state === 'on';
                            const isUpdating = updatingEntities[update.id] || entity.attributes.in_progress;
                            const updateError = updateErrors[update.id];
                            const Icon = update.icon;

                            return (
                                <Card
                                    key={update.id}
                                    delay={(categorizedUpdates.system.length + categorizedUpdates.addons.length + idx) * 50}
                                    className={`transition-all duration-500 ${hasUpdate ? 'border-amber-500/30 shadow-[0_0_20px_-5px_rgba(251,191,36,0.2)]' : ''
                                        } ${isUpdating ? 'border-blue-500/30 shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)]' : ''}`}
                                    editMode={editMode}
                                    onEditClick={onCardEdit}
                                    cardId={`update-esphome-${update.id}`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 ${isUpdating ? 'bg-blue-500/20 text-blue-400' :
                                                hasUpdate ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-slate-800 text-slate-500'
                                                }`}>
                                                {isUpdating ? (
                                                    <RefreshCw size={18} className="animate-spin" />
                                                ) : (
                                                    <Icon size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-200">{update.name}</div>
                                                <div className="text-[10px] text-slate-500 tracking-wider">
                                                    {entity.attributes.installed_version || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        {hasUpdate && !isUpdating && (
                                            <button
                                                onClick={() => handleInstallUpdate(update.id, update.name, entity)}
                                                disabled={isUpdating}
                                                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors p-2 hover:bg-amber-500/10 rounded-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={`Install update for ${update.name}`}
                                            >
                                                <Download size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {isUpdating && (
                                        <div className="text-xs text-blue-400/80 bg-blue-500/10 px-2 py-1 rounded flex items-center gap-2">
                                            <RefreshCw size={12} className="animate-spin" />
                                            Installing update...
                                        </div>
                                    )}

                                    {updateError && (
                                        <div className="text-xs text-red-400/80 bg-red-500/10 px-2 py-1 rounded flex items-center gap-2">
                                            <AlertTriangle size={12} />
                                            {updateError}
                                        </div>
                                    )}

                                    {hasUpdate && !isUpdating && !updateError && (
                                        <div className="text-xs text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded">
                                            Update available: {entity.attributes.latest_version}
                                        </div>
                                    )}

                                    {!hasUpdate && !isUpdating && !updateError && (
                                        <div className="text-xs text-emerald-500/80 flex items-center gap-1">
                                            <CheckCircle size={12} /> Up to date
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Other Updates (if any) */}
            {categorizedUpdates.other.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <h2 className="text-2xl font-serif text-slate-200 px-2">Other Updates</h2>
                        <p className="text-sm text-slate-500 px-2 mt-1">Additional update entities</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categorizedUpdates.other.map((update, idx) => {
                            const entity = useEntity(hassStates, update.id, { state: 'off', attributes: { latest_version: 'N/A', installed_version: 'N/A', in_progress: false } });
                            const hasUpdate = entity.state === 'on';
                            const isUpdating = updatingEntities[update.id] || entity.attributes.in_progress;
                            const updateError = updateErrors[update.id];
                            const Icon = update.icon;

                            return (
                                <Card
                                    key={update.id}
                                    delay={(categorizedUpdates.system.length + categorizedUpdates.addons.length + categorizedUpdates.esphome.length + idx) * 50}
                                    className={`transition-all duration-500 ${hasUpdate ? 'border-amber-500/30 shadow-[0_0_20px_-5px_rgba(251,191,36,0.2)]' : ''
                                        } ${isUpdating ? 'border-blue-500/30 shadow-[0_0_20px_-5px_rgba(59,130,246,0.2)]' : ''}`}
                                    editMode={editMode}
                                    onEditClick={onCardEdit}
                                    cardId={`update-other-${update.id}`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 ${isUpdating ? 'bg-blue-500/20 text-blue-400' :
                                                hasUpdate ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-slate-800 text-slate-500'
                                                }`}>
                                                {isUpdating ? (
                                                    <RefreshCw size={18} className="animate-spin" />
                                                ) : (
                                                    <Icon size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm text-slate-200">{update.name}</div>
                                                <div className="text-[10px] text-slate-500 tracking-wider">
                                                    {entity.attributes.installed_version || 'N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        {hasUpdate && !isUpdating && (
                                            <button
                                                onClick={() => handleInstallUpdate(update.id, update.name, entity)}
                                                disabled={isUpdating}
                                                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors p-2 hover:bg-amber-500/10 rounded-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title={`Install update for ${update.name}`}
                                            >
                                                <Download size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {isUpdating && (
                                        <div className="text-xs text-blue-400/80 bg-blue-500/10 px-2 py-1 rounded flex items-center gap-2">
                                            <RefreshCw size={12} className="animate-spin" />
                                            Installing update...
                                        </div>
                                    )}

                                    {updateError && (
                                        <div className="text-xs text-red-400/80 bg-red-500/10 px-2 py-1 rounded flex items-center gap-2">
                                            <AlertTriangle size={12} />
                                            {updateError}
                                        </div>
                                    )}

                                    {hasUpdate && !isUpdating && !updateError && (
                                        <div className="text-xs text-amber-400/80 bg-amber-500/10 px-2 py-1 rounded">
                                            Update available: {entity.attributes.latest_version}
                                        </div>
                                    )}

                                    {!hasUpdate && !isUpdating && !updateError && (
                                        <div className="text-xs text-emerald-500/80 flex items-center gap-1">
                                            <CheckCircle size={12} /> Up to date
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UpdatesView;
