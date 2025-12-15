import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, Edit, Trash2, MapPin, Smartphone, List, ChevronRight, AlertCircle,
  Settings as SettingsIcon, Download, Thermometer, Zap, Wind, Volume2,
  RotateCw, Power, Eye, Activity, Clock, Plus
} from 'lucide-react';
import { useSettingsNav } from '../SettingsView';
import { useAccentColor } from '../../context/AccentColorContext';
import { useHomeAssistant } from '../../context/HomeAssistantContext';
import useHAStore from '../../stores/haStore';
import DeviceEditModal from '../../components/DeviceEditModal';

/**
 * Device Detail View
 * Shows detailed information about a specific device (Home Assistant style)
 */
const DeviceDetailView = ({ deviceId }) => {
  const { navigate } = useSettingsNav();
  const { colors } = useAccentColor();
  const { callService } = useHomeAssistant();
  const { devices, devicesById, entityRegistry, areasById, configEntriesById, statesByEntityId, removeDevice } = useHAStore();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [downloadingDiagnostics, setDownloadingDiagnostics] = useState(false);

  // Get the device
  const device = useMemo(() => {
    return devicesById[deviceId];
  }, [devicesById, deviceId]);

  // Get entities for this device
  const deviceEntities = useMemo(() => {
    if (!device) return [];
    return entityRegistry.filter(e => e.device_id === deviceId);
  }, [entityRegistry, deviceId, device]);

  // Get area
  const area = useMemo(() => {
    if (!device?.area_id) return null;
    return areasById[device.area_id];
  }, [device, areasById]);

  // Get config entries
  const configEntries = useMemo(() => {
    if (!device?.config_entries) return [];
    return device.config_entries.map(entryId => configEntriesById[entryId]).filter(Boolean);
  }, [device, configEntriesById]);

  if (!device) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings/devices-services')}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Device Not Found</h1>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Device not found</h3>
          <p className="text-slate-500">The device you're looking for doesn't exist</p>
        </div>
      </div>
    );
  }

  const deviceName = device.name_by_user || device.name || 'Unnamed Device';

  // Group entities by domain
  const entitiesByDomain = useMemo(() => {
    const grouped = {};
    deviceEntities.forEach(entity => {
      const domain = entity.entity_id.split('.')[0];
      if (!grouped[domain]) grouped[domain] = [];
      grouped[domain].push(entity);
    });
    return grouped;
  }, [deviceEntities]);

  // Get control entities (switches, lights, fans, etc.)
  const controlEntities = useMemo(() => {
    return deviceEntities.filter(e => {
      const domain = e.entity_id.split('.')[0];
      return ['switch', 'light', 'fan', 'cover', 'climate', 'lock', 'media_player'].includes(domain);
    });
  }, [deviceEntities]);

  // Get sensor entities
  const sensorEntities = useMemo(() => {
    return deviceEntities.filter(e => {
      const domain = e.entity_id.split('.')[0];
      return ['sensor', 'binary_sensor'].includes(domain);
    });
  }, [deviceEntities]);

  // Get recent activity (last 5 state changes)
  const recentActivity = useMemo(() => {
    const activities = [];
    deviceEntities.forEach(entity => {
      const state = statesByEntityId[entity.entity_id];
      if (state?.last_changed) {
        activities.push({
          entity_id: entity.entity_id,
          name: entity.name || state.attributes?.friendly_name || entity.entity_id,
          state: state.state,
          last_changed: state.last_changed,
          attributes: state.attributes
        });
      }
    });
    return activities.sort((a, b) => new Date(b.last_changed) - new Date(a.last_changed)).slice(0, 10);
  }, [deviceEntities, statesByEntityId]);

  // Helper to format time ago
  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  // Handler functions
  const handleDownloadDiagnostics = async () => {
    setDownloadingDiagnostics(true);
    try {
      // Call Home Assistant service to download diagnostics
      await callService('system_log', 'write', {
        message: `Diagnostics requested for device: ${deviceName} (${deviceId})`,
        level: 'info'
      });

      // In a real implementation, this would trigger a download
      // For now, we'll just show a notification
      alert(`Diagnostics for ${deviceName} would be downloaded here.\n\nDevice ID: ${deviceId}\nEntities: ${deviceEntities.length}`);
    } catch (error) {
      console.error('Failed to download diagnostics:', error);
      alert('Failed to download diagnostics. Check console for details.');
    } finally {
      setDownloadingDiagnostics(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!deleteConfirmOpen) {
      setDeleteConfirmOpen(true);
      return;
    }

    try {
      // Remove device from Home Assistant
      await removeDevice(deviceId);
      // Navigate back to devices list
      navigate('/settings/devices-services');
    } catch (error) {
      console.error('Failed to delete device:', error);
      alert('Failed to delete device. Check console for details.');
    }
  };

  const handleAddScene = () => {
    // Navigate to scene creation with this device pre-selected
    alert(`Create scene with ${deviceName}\n\nThis would open the scene editor with this device's entities pre-selected.`);
  };

  const handleAddScript = () => {
    // Navigate to script creation with this device pre-selected
    alert(`Create script with ${deviceName}\n\nThis would open the script editor with this device's entities pre-selected.`);
  };

  const handleAddToDashboard = (entityIds) => {
    // Add entities to dashboard
    const entityList = entityIds.map(id => `  - ${id}`).join('\n');
    alert(`Add to dashboard:\n\n${entityList}\n\nThis would add these entities to your dashboard.`);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => navigate('/settings/devices-services')}
              className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-2xl font-semibold text-slate-100 truncate">{deviceName}</h1>
              {area && (
                <p className="text-xs sm:text-sm text-amber-400 mt-0.5 truncate">In {area.name}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setEditModalOpen(true)}
            className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
          >
            <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 p-3 sm:p-6">

        {/* LEFT COLUMN - Device Info */}
        <div className="space-y-4 sm:space-y-6">
          {/* Device Info Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-5">
            <h2 className="text-sm sm:text-base font-semibold text-slate-100 mb-3 sm:mb-4">Device info</h2>
            <div className="space-y-2 sm:space-y-3">
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 mb-1">ID</p>
                <p className="text-xs sm:text-sm text-slate-300 font-mono break-all">{device.id}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500 mb-1">by {device.manufacturer || 'Unknown'}</p>
              </div>
              {device.model && (
                <div className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 cursor-pointer transition-colors">
                  <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">{device.model}</span>
                  <ChevronRight className="w-3 h-3 ml-auto" />
                </div>
              )}
            </div>
          </div>

          {/* Integration Card */}
          {configEntries.length > 0 && configEntries.map(entry => (
            <div key={entry.entry_id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-5">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <SettingsIcon className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                <h3 className="text-xs sm:text-sm font-semibold text-slate-100">{entry.domain}</h3>
              </div>
              <button
                onClick={() => navigate(`/settings/devices-services/integration/${entry.domain}`)}
                className="text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View integration →
              </button>
            </div>
          ))}

          {/* Download Diagnostics */}
          <button
            onClick={handleDownloadDiagnostics}
            disabled={downloadingDiagnostics}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-4 hover:bg-slate-900 transition-colors flex items-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-xs sm:text-sm text-amber-400">
              {downloadingDiagnostics ? 'Downloading...' : 'Download diagnostics'}
            </span>
          </button>

          {/* Scenes Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-sm sm:text-base font-semibold text-slate-100">Scenes</h2>
              <button
                onClick={handleAddScene}
                className="text-amber-400 hover:text-amber-300 transition-colors"
                title="Add scene"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500">
              No scenes have been added using this device yet. You can add one by pressing the + button above.
            </p>
          </div>

          {/* Scripts Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h2 className="text-sm sm:text-base font-semibold text-slate-100">Scripts</h2>
              <button
                onClick={handleAddScript}
                className="text-amber-400 hover:text-amber-300 transition-colors"
                title="Add script"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500">
              No scripts have been added using this device yet. You can add one by pressing the + button above.
            </p>
          </div>
        </div>

        {/* MIDDLE COLUMN - Controls */}
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-5">
            <h2 className="text-sm sm:text-base font-semibold text-slate-100 mb-3 sm:mb-4">Controls</h2>

            {controlEntities.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-500">No controllable entities</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {controlEntities.map(entity => {
                  const state = statesByEntityId[entity.entity_id];
                  const domain = entity.entity_id.split('.')[0];
                  const friendlyName = entity.name || state?.attributes?.friendly_name || entity.entity_id;
                  const isOn = state?.state === 'on';

                  return (
                    <div key={entity.entity_id} className="space-y-2">
                      {/* Entity Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          {domain === 'fan' && <Wind className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />}
                          {domain === 'light' && <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />}
                          {domain === 'switch' && <Power className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />}
                          {domain === 'media_player' && <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400 flex-shrink-0" />}
                          <span className="text-xs sm:text-sm text-slate-200 truncate">{friendlyName}</span>
                        </div>
                        <button
                          onClick={() => {
                            callService(domain, isOn ? 'turn_off' : 'turn_on', { entity_id: entity.entity_id });
                          }}
                          className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                            isOn ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                              isOn ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Sliders for fan/light */}
                      {domain === 'fan' && state?.attributes?.percentage !== undefined && (
                        <div className="pl-7">
                          <div className="flex items-center gap-3">
                            <Wind className="w-3 h-3 text-slate-500" />
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={state.attributes.percentage || 0}
                              onChange={(e) => {
                                callService('fan', 'set_percentage', {
                                  entity_id: entity.entity_id,
                                  percentage: parseInt(e.target.value)
                                });
                              }}
                              className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <span className="text-xs text-slate-400 w-8 text-right">
                              {state.attributes.percentage}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Oscillation toggles */}
                      {domain === 'fan' && state?.attributes?.oscillating !== undefined && (
                        <div className="pl-7">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <RotateCw className="w-3 h-3 text-slate-500" />
                              <span className="text-xs text-slate-400">Horizontal Oscillation</span>
                            </div>
                            <button
                              onClick={() => {
                                callService('fan', 'oscillate', {
                                  entity_id: entity.entity_id,
                                  oscillating: !state.attributes.oscillating
                                });
                              }}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                state.attributes.oscillating ? 'bg-cyan-500' : 'bg-slate-700'
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  state.attributes.oscillating ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add to dashboard button */}
            {controlEntities.length > 0 && (
              <button
                onClick={() => handleAddToDashboard(controlEntities.map(e => e.entity_id))}
                className="w-full mt-6 py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                Add to dashboard
              </button>
            )}
          </div>

          {/* Sensors Section */}
          {sensorEntities.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
              <h2 className="text-base font-semibold text-slate-100 mb-4">Sensors</h2>
              <div className="space-y-3">
                {sensorEntities.map(entity => {
                  const state = statesByEntityId[entity.entity_id];
                  const friendlyName = entity.name || state?.attributes?.friendly_name || entity.entity_id;
                  const value = state?.state || 'unknown';
                  const unit = state?.attributes?.unit_of_measurement || '';

                  return (
                    <div key={entity.entity_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300">{friendlyName}</span>
                      </div>
                      <span className="text-sm font-medium text-slate-100">
                        {value} {unit}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => handleAddToDashboard(sensorEntities.map(e => e.entity_id))}
                className="w-full mt-4 py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
              >
                Add to dashboard
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Activity */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-100">Activity</h2>
              <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded">
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {recentActivity.map((activity, idx) => {
                  const domain = activity.entity_id.split('.')[0];
                  let description = '';

                  // Generate activity description
                  if (domain === 'switch' || domain === 'light' || domain === 'fan') {
                    if (activity.state === 'on') {
                      description = `${activity.name} turned on`;
                    } else if (activity.state === 'off') {
                      description = `${activity.name} turned off`;
                    } else {
                      description = `${activity.name} changed to ${activity.state}`;
                    }
                  } else if (domain === 'sensor') {
                    const unit = activity.attributes?.unit_of_measurement || '';
                    description = `${activity.name} changed to ${activity.state}${unit ? ' ' + unit : ''}`;
                  } else {
                    description = `${activity.name} changed to ${activity.state}`;
                  }

                  return (
                    <div key={`${activity.entity_id}-${idx}`} className="border-l-2 border-slate-700 pl-3 py-1">
                      <p className="text-sm text-slate-300">{description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="text-xs text-slate-500">{timeAgo(activity.last_changed)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Entities List (Below three columns) */}
      <div className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 sm:p-5">
          <h2 className="text-sm sm:text-base font-semibold text-slate-100 mb-3 sm:mb-4 flex items-center gap-2">
            <List className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            All Entities ({deviceEntities.length})
          </h2>

          {deviceEntities.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-slate-500">
              No entities found for this device
            </div>
          ) : (
            <div className="space-y-1 sm:space-y-2">
              {deviceEntities.map(entity => {
                const state = statesByEntityId[entity.entity_id];
                const friendlyName = entity.name || state?.attributes?.friendly_name || entity.entity_id;
              const currentValue = state?.state ?? 'unavailable';

              return (
                <button
                  key={entity.entity_id}
                  onClick={() => navigate(`/settings/devices-services/entity/${entity.entity_id}`)}
                  className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-slate-800/50 rounded-lg transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h3 className="text-xs sm:text-sm text-slate-200 group-hover:text-cyan-400 transition-colors truncate">{friendlyName}</h3>
                      {entity.disabled_by && (
                        <span className="px-1 sm:px-1.5 py-0.5 bg-red-900/30 text-red-400 text-[10px] sm:text-xs rounded flex-shrink-0">
                          Disabled
                        </span>
                      )}
                      {entity.hidden_by && (
                        <span className="px-1 sm:px-1.5 py-0.5 bg-slate-700 text-slate-400 text-[10px] sm:text-xs rounded flex-shrink-0">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-slate-500">
                      <span className="font-mono truncate">{entity.entity_id}</span>
                      <span className="flex-shrink-0">•</span>
                      <span className={`flex-shrink-0 ${
                        currentValue === 'unavailable' ? 'text-red-400' :
                        currentValue === 'unknown' ? 'text-slate-500' :
                        'text-slate-400'
                      }`}>
                        {currentValue}
                      </span>
                      {state?.attributes?.unit_of_measurement && (
                        <span className="flex-shrink-0">{state.attributes.unit_of_measurement}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
        </div>
      </div>

      {/* Edit Modal */}
      <DeviceEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        device={device}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-slate-100 mb-4">Delete Device?</h3>
            <p className="text-slate-400 mb-6">
              Are you sure you want to delete <span className="text-slate-200 font-medium">{deviceName}</span>?
              This will remove the device and all {deviceEntities.length} associated entities.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteDevice}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceDetailView;

