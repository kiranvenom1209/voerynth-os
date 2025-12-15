import React, { useMemo, useState } from 'react';
import { List, Edit, EyeOff, MapPin, Search } from 'lucide-react';
import { useAccentColor } from '../../../context/AccentColorContext';
import { useSettingsNav } from '../../SettingsView';
import useHAStore from '../../../stores/haStore';
import { useHomeAssistant } from '../../../context/HomeAssistantContext';

/**
 * Entities Tab
 * Shows all entities with navigation to entity detail pages
 */
const EntitiesTab = () => {
  const { colors } = useAccentColor();
  const { navigate } = useSettingsNav();
  const [searchQuery, setSearchQuery] = useState('');
  
  const { entityRegistry, areasById, devicesById, loading } = useHAStore();
  const { hassStates } = useHomeAssistant();

  // Process entities with area names, device names, and current states
  const entitiesData = useMemo(() => {
    return entityRegistry.map(entity => {
      const area = entity.area_id ? areasById[entity.area_id] : null;
      const device = entity.device_id ? devicesById[entity.device_id] : null;
      const state = hassStates[entity.entity_id];
      
      return {
        ...entity,
        area: area?.name || (device?.area_id ? areasById[device.area_id]?.name : null) || 'Unassigned',
        deviceName: device?.name_by_user || device?.name,
        state: state?.state || 'unknown',
        platform: entity.platform || 'unknown',
        name: entity.name || entity.entity_id
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [entityRegistry, areasById, devicesById, hassStates]);

  // Filter entities based on search
  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return entitiesData;
    
    const query = searchQuery.toLowerCase();
    return entitiesData.filter(entity => 
      entity.name.toLowerCase().includes(query) ||
      entity.entity_id.toLowerCase().includes(query) ||
      entity.platform.toLowerCase().includes(query)
    );
  }, [entitiesData, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading entities...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search entities..."
          className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Entities List */}
      {filteredEntities.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No entities found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntities.map(entity => (
            <button
              key={entity.entity_id}
              onClick={() => navigate(`/settings/devices-services/entity/${entity.entity_id}`)}
              className="w-full group bg-slate-800/50 border border-slate-700 rounded-lg p-3 sm:p-4 hover:border-cyan-500/50 transition-all text-left"
            >
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm sm:text-base text-slate-100 font-medium group-hover:text-cyan-400 transition-colors truncate">
                      {entity.name}
                    </h3>
                    {entity.disabled && (
                      <span className="px-1.5 sm:px-2 py-0.5 bg-red-900/30 text-red-400 text-[10px] sm:text-xs rounded flex-shrink-0">
                        Disabled
                      </span>
                    )}
                    {entity.hidden && (
                      <EyeOff className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 flex-shrink-0" title="Hidden" />
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 font-mono truncate">{entity.entity_id}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className={`text-xs sm:text-sm font-semibold truncate ${
                      entity.state === 'unavailable' ? 'text-red-400' : 'text-cyan-400'
                    }`}>
                      {entity.state}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 truncate">{entity.platform}</div>
                  </div>
                </div>
              </div>

              <div className="mt-2 sm:mt-3 flex items-center justify-between text-xs sm:text-sm gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 min-w-0">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className={`truncate ${entity.area !== 'Unassigned' ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {entity.area}
                  </span>
                </div>
                {entity.deviceName && (
                  <div className="text-[10px] sm:text-xs text-slate-500 truncate max-w-[40%]">
                    {entity.deviceName}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntitiesTab;

