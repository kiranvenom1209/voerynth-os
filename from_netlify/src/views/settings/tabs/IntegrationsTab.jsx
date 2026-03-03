import React, { useMemo } from 'react';
import { Plus, Puzzle, Smartphone, List, ChevronRight, AlertCircle } from 'lucide-react';
import { useAccentColor } from '../../../context/AccentColorContext';
import { useSettingsNav } from '../../SettingsView';
import useHAStore from '../../../stores/haStore';

/**
 * Integrations Tab
 * Shows all integrations grouped by domain with device/entity counts
 */
const IntegrationsTab = () => {
  const { colors } = useAccentColor();
  const { navigate } = useSettingsNav();
  
  const { 
    configEntriesByDomain, 
    getIntegrationStats,
    loading 
  } = useHAStore();

  // Build integration list with stats
  const integrations = useMemo(() => {
    console.log('🔍 IntegrationsTab: Building integrations list');
    console.log('📦 configEntriesByDomain:', configEntriesByDomain);
    console.log('📊 Domains found:', Object.keys(configEntriesByDomain));

    const domains = Object.keys(configEntriesByDomain).sort();

    const result = domains.map(domain => {
      const stats = getIntegrationStats(domain);
      console.log(`📈 Stats for ${domain}:`, stats);

      return {
        domain,
        title: formatDomainName(domain),
        ...stats
      };
    });

    console.log('✅ Final integrations list:', result);
    return result;
  }, [configEntriesByDomain, getIntegrationStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading integrations...</div>
      </div>
    );
  }

  if (integrations.length === 0) {
    return (
      <div className="text-center py-12">
        <Puzzle className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
        <p className="text-slate-400 mb-4">No integrations found</p>
        <button
          className={`px-4 py-2 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors`}
        >
          Add Integration
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Integration Button */}
      <button
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors`}
      >
        <Plus className="w-5 h-5" />
        Add Integration
      </button>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <button
            key={integration.domain}
            onClick={() => navigate(`/settings/devices-services/integration/${integration.domain}`)}
            className="group bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 hover:border-cyan-500/50 transition-all text-left"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0 pr-2">
                <h3 className="text-base sm:text-lg font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors truncate">
                  {integration.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-mono truncate">{integration.domain}</p>
              </div>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-sm">
              <div className="min-w-0 overflow-hidden">
                <div className="text-slate-400 text-[9px] sm:text-xs mb-0.5 sm:mb-1 truncate">Entries</div>
                <div className="text-cyan-400 font-semibold text-xs sm:text-base truncate">{integration.entryCount}</div>
              </div>
              <div className="min-w-0 overflow-hidden">
                <div className="text-slate-400 text-[9px] sm:text-xs mb-0.5 sm:mb-1 truncate">Devices</div>
                <div className="text-cyan-400 font-semibold text-xs sm:text-base truncate">{integration.deviceCount}</div>
              </div>
              <div className="min-w-0 overflow-hidden">
                <div className="text-slate-400 text-[9px] sm:text-xs mb-0.5 sm:mb-1 truncate">Entities</div>
                <div className="text-cyan-400 font-semibold text-xs sm:text-base truncate">{integration.entityCount}</div>
              </div>
            </div>

            {/* Entry Status Indicators */}
            {integration.entries.some(e => e.state === 'failed_unload' || e.state === 'setup_error') && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
                <AlertCircle className="w-3 h-3" />
                <span>Configuration issue</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Format domain name for display
 * @param {string} domain - Integration domain
 * @returns {string} Formatted name
 */
function formatDomainName(domain) {
  // Special cases
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

  // Convert snake_case to Title Case
  return domain
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default IntegrationsTab;

