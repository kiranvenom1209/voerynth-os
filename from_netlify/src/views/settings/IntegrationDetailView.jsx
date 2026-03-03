import React, { useMemo, useState } from 'react';
import { ArrowLeft, Settings, Trash2, RefreshCw, AlertCircle, CheckCircle, ChevronRight, Smartphone, List } from 'lucide-react';
import { useSettingsNav } from '../SettingsView';
import { useAccentColor } from '../../context/AccentColorContext';
import useHAStore from '../../stores/haStore';
import haClient from '../../services/haClient';

/**
 * Integration Detail View
 * Shows all config entries for a specific integration domain
 */
const IntegrationDetailView = ({ domain }) => {
  const { navigate } = useSettingsNav();
  const { colors } = useAccentColor();
  const { configEntriesByDomain, devices, entityRegistry, getIntegrationStats, refreshRegistries } = useHAStore();
  const [expandedEntry, setExpandedEntry] = useState(null);
  const [reloadingEntry, setReloadingEntry] = useState(null);

  // Get all entries for this domain
  const entries = useMemo(() => {
    return configEntriesByDomain[domain] || [];
  }, [configEntriesByDomain, domain]);

  // Get stats for this integration
  const stats = useMemo(() => {
    return getIntegrationStats(domain);
  }, [domain, getIntegrationStats]);

  // Get devices for a specific entry
  const getEntryDevices = (entryId) => {
    return devices.filter(d => d.config_entries?.includes(entryId));
  };

  // Get entities for a specific entry
  const getEntryEntities = (entryId) => {
    return entityRegistry.filter(e => e.config_entry_id === entryId);
  };

  // Format domain name
  const formatDomainName = (domain) => {
    const specialNames = {
      'esphome': 'ESPHome',
      'mqtt': 'MQTT',
      'hacs': 'HACS',
      'homeassistant': 'System Core',
      'zha': 'Zigbee Automation',
      'zwave_js': 'Z-Wave JS',
      'google_assistant': 'Google Assistant',
      'alexa': 'Amazon Alexa',
    };

    if (specialNames[domain]) {
      return specialNames[domain];
    }

    return domain
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusIcon = (state) => {
    if (state === 'loaded') {
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
    return <AlertCircle className="w-5 h-5 text-red-400" />;
  };

  const getStatusText = (state) => {
    const statusMap = {
      'loaded': 'Loaded',
      'setup_error': 'Setup Error',
      'setup_retry': 'Retrying',
      'not_loaded': 'Not Loaded',
      'failed_unload': 'Failed to Unload'
    };
    return statusMap[state] || state;
  };

  // Handle reload config entry
  const handleReloadEntry = async (entryId) => {
    try {
      setReloadingEntry(entryId);
      console.log(`🔄 Reloading config entry: ${entryId}`);

      await haClient.callApi('POST', `config/config_entries/entry/${entryId}/reload`);

      console.log('✅ Config entry reloaded successfully');

      // Refresh registries to get updated state
      await refreshRegistries();
    } catch (error) {
      console.error('❌ Failed to reload config entry:', error);
      alert(`Failed to reload: ${error.message}`);
    } finally {
      setReloadingEntry(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            onClick={() => navigate('/settings/devices-services')}
            className="p-1.5 sm:p-2 hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-slate-100 truncate">{formatDomainName(domain)}</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 truncate">
              {stats.entryCount} {stats.entryCount === 1 ? 'entry' : 'entries'} • {stats.deviceCount} devices • {stats.entityCount} entities
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 sm:p-4">
          <div className="text-[10px] sm:text-sm text-slate-400 mb-0.5 sm:mb-1">Config Entries</div>
          <div className="text-base sm:text-2xl font-bold text-cyan-400">{stats.entryCount}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 sm:p-4">
          <div className="text-[10px] sm:text-sm text-slate-400 mb-0.5 sm:mb-1">Devices</div>
          <div className="text-base sm:text-2xl font-bold text-cyan-400">{stats.deviceCount}</div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 sm:p-4">
          <div className="text-[10px] sm:text-sm text-slate-400 mb-0.5 sm:mb-1">Entities</div>
          <div className="text-base sm:text-2xl font-bold text-cyan-400">{stats.entityCount}</div>
        </div>
      </div>

      {/* Config Entries List */}
      <div className="space-y-2 sm:space-y-3">
        <h2 className="text-base sm:text-xl font-semibold text-slate-100">Configuration Entries</h2>

        {entries.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 sm:p-12 text-center">
            <AlertCircle className="w-8 h-8 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-slate-300 mb-1 sm:mb-2">No entries found</h3>
            <p className="text-xs sm:text-sm text-slate-500">This integration has no configuration entries</p>
          </div>
        ) : (
          entries.map(entry => {
            const entryDevices = getEntryDevices(entry.entry_id);
            const entryEntities = getEntryEntities(entry.entry_id);
            const isExpanded = expandedEntry === entry.entry_id;

            return (
              <div
                key={entry.entry_id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden"
              >
                {/* Entry Header */}
                <div className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      {getStatusIcon(entry.state)}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base text-slate-100 font-medium truncate">{entry.title}</h3>
                        <div className="flex items-center gap-1.5 sm:gap-3 mt-0.5 sm:mt-1 text-xs sm:text-sm text-slate-400">
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs flex-shrink-0 ${
                            entry.state === 'loaded'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {getStatusText(entry.state)}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate">{entryDevices.length} devices</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate">{entryEntities.length} entities</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      {entry.supports_options && (
                        <button
                          className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Configure"
                        >
                          <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleReloadEntry(entry.entry_id)}
                        disabled={reloadingEntry === entry.entry_id}
                        className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reload"
                      >
                        <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 text-slate-400 ${reloadingEntry === entry.entry_id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={() => setExpandedEntry(isExpanded ? null : entry.entry_id)}
                        className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <ChevronRight className={`w-3 h-3 sm:w-4 sm:h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-700 p-3 sm:p-4 bg-slate-900/30">
                    {/* Devices */}
                    {entryDevices.length > 0 && (
                      <div className="mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-300">
                            Devices ({entryDevices.length})
                          </h4>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          {entryDevices.map(device => (
                            <button
                              key={device.id}
                              onClick={() => navigate(`/settings/devices-services/device/${device.id}`)}
                              className="w-full flex items-center justify-between p-2 sm:p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs sm:text-sm text-slate-200 truncate">{device.name || device.name_by_user}</div>
                                <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">
                                  {device.manufacturer} {device.model}
                                </div>
                              </div>
                              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Entities */}
                    {entryEntities.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2 sm:mb-3">
                          <List className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                          <h4 className="text-xs sm:text-sm font-semibold text-slate-300">
                            Entities ({entryEntities.length})
                          </h4>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                          {entryEntities.map(entity => (
                            <button
                              key={entity.entity_id}
                              onClick={() => navigate(`/settings/devices-services/entity/${entity.entity_id}`)}
                              className="w-full flex items-center justify-between p-2 sm:p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors text-left"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs sm:text-sm text-slate-200 truncate">{entity.name || entity.original_name}</div>
                                <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 font-mono truncate">{entity.entity_id}</div>
                              </div>
                              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No devices or entities */}
                    {entryDevices.length === 0 && entryEntities.length === 0 && (
                      <div className="text-center py-4 sm:py-6 text-slate-500 text-xs sm:text-sm">
                        No devices or entities found for this entry
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default IntegrationDetailView;

