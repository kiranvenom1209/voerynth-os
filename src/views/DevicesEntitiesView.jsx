import React, { useEffect, useState, useRef } from 'react';
import { Search, RefreshCw, Smartphone, List, MapPin, AlertCircle, EyeOff, Power, Edit, Plus } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';
import { useHomeAssistant } from '../context/HomeAssistantContext';
import useHAStore from '../stores/haStore';
import haClient from '../services/haClient';
import EntityEditModal from '../components/EntityEditModal';
import DeviceEditModal from '../components/DeviceEditModal';
import AreaEditModal from '../components/AreaEditModal';

/**
 * Devices & Entities View - HA-Style Implementation
 * 
 * Uses proper HA approach:
 * - subscribeEntities for live state updates
 * - config/area_registry/list for areas
 * - config/device_registry/list for devices
 * - config/entity_registry/list for entity registry
 * - Proper join logic matching HA frontend
 */
const DevicesEntitiesView = () => {
  const { colors } = useAccentColor();
  const [activeTab, setActiveTab] = useState('devices');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const initializedRef = useRef(false);

  // Edit modals state
  const [entityEditModal, setEntityEditModal] = useState({ isOpen: false, entity: null });
  const [deviceEditModal, setDeviceEditModal] = useState({ isOpen: false, device: null });
  const [areaEditModal, setAreaEditModal] = useState({ isOpen: false, area: null, isNew: false });

  // Get HA connection and states from context
  const { hassStates, connectionStatus, getHAConnection } = useHomeAssistant();

  // Get data from HA store
  const {
    statesByEntityId,
    areas,
    devices,
    entityRegistry,
    areasById,
    devicesById,
    entityRegByEntityId,
    loading,
    error,
    subscriptionActive,
    initialize,
    updateStates,
    refreshRegistries,
  } = useHAStore();

  // Set up HAClient with existing connection - ONLY RUN ONCE
  useEffect(() => {
    // Prevent infinite loop - only initialize once
    if (initializedRef.current) {
      console.log('⏭️ Already initialized, skipping');
      return;
    }

    const haConnection = getHAConnection();
    console.log('🔍 useEffect triggered - connection:', haConnection?.connected, 'states:', Object.keys(hassStates || {}).length);

    if (haConnection && haConnection.connected && hassStates && Object.keys(hassStates).length > 0) {
      console.log('🔌 Setting up HAClient with existing connection');
      haClient.setHAConnection(haConnection);

      console.log('📊 Calling initialize with', Object.keys(hassStates).length, 'states');
      initializedRef.current = true; // Mark as initialized

      initialize(hassStates).catch(err => {
        console.error('❌ Initialize failed:', err);
        initializedRef.current = false; // Reset on error so we can retry
      });
    } else {
      console.log('⚠️ HAConnection not ready or no states available');
    }
  }, [connectionStatus, hassStates, getHAConnection, initialize]);

  // Update states when they change
  useEffect(() => {
    if (hassStates && Object.keys(hassStates).length > 0) {
      updateStates(hassStates);
    }
  }, [hassStates, updateStates]);
  
  // ============================================================================
  // DEVICES TAB - HA-STYLE JOIN LOGIC
  // ============================================================================
  
  const getDevicesData = () => {
    return devices.map(device => {
      // Name priority: name_by_user > name > "Unnamed"
      const name = device.name_by_user || device.name || 'Unnamed Device';
      
      // Area lookup
      const area = areasById[device.area_id];
      const areaName = area?.name || 'Unassigned';
      
      // Count entities in this device
      const entitiesInDevice = entityRegistry.filter(e => e.device_id === device.id);
      
      return {
        id: device.id,
        name,
        manufacturer: device.manufacturer || 'Unknown',
        model: device.model || 'Unknown',
        sw_version: device.sw_version,
        area: areaName,
        area_id: device.area_id,
        entityCount: entitiesInDevice.length,
        disabled: device.disabled_by !== null,
      };
    }).filter(device => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        device.name.toLowerCase().includes(query) ||
        device.manufacturer.toLowerCase().includes(query) ||
        device.model.toLowerCase().includes(query) ||
        device.area.toLowerCase().includes(query)
      );
    });
  };
  
  // ============================================================================
  // ENTITIES TAB - HA-STYLE JOIN LOGIC
  // ============================================================================
  
  const getEntitiesData = () => {
    return entityRegistry.map(reg => {
      const entityId = reg.entity_id;
      const state = statesByEntityId[entityId];
      
      // Friendly name priority: reg.name > state.attributes.friendly_name > entity_id
      const friendlyName = reg.name || state?.attributes?.friendly_name || entityId;
      
      // Current value
      const currentValue = state?.state ?? 'unavailable';
      
      // Area name - complex join logic
      let areaName = 'Unassigned';
      if (reg.area_id) {
        // Entity directly assigned to area
        areaName = areasById[reg.area_id]?.name || 'Unassigned';
      } else if (reg.device_id) {
        // Entity assigned via device
        const device = devicesById[reg.device_id];
        if (device?.area_id) {
          areaName = areasById[device.area_id]?.name || 'Unassigned';
        }
      }
      
      return {
        entity_id: entityId,
        name: friendlyName,
        state: currentValue,
        platform: reg.platform || 'unknown',
        area: areaName,
        device_id: reg.device_id,
        disabled: reg.disabled_by !== null,
        hidden: reg.hidden_by !== null,
        icon: reg.icon || state?.attributes?.icon,
      };
    }).filter(entity => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        entity.entity_id.toLowerCase().includes(query) ||
        entity.name.toLowerCase().includes(query) ||
        entity.platform.toLowerCase().includes(query) ||
        entity.area.toLowerCase().includes(query)
      );
    });
  };
  
  // ============================================================================
  // AREAS TAB - HA-STYLE JOIN LOGIC
  // ============================================================================
  
  const getAreasData = () => {
    return areas.map(area => {
      // Count devices in this area
      const devicesCount = devices.filter(d => d.area_id === area.area_id).length;
      
      // Count entities in this area (direct + via device)
      const entitiesCount = entityRegistry.filter(e => {
        if (e.area_id === area.area_id) return true;
        if (e.device_id) {
          const device = devicesById[e.device_id];
          return device?.area_id === area.area_id;
        }
        return false;
      }).length;
      
      return {
        area_id: area.area_id,
        name: area.name,
        aliases: area.aliases || [],
        devicesCount,
        entitiesCount,
      };
    }).filter(area => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        area.name.toLowerCase().includes(query) ||
        area.aliases.some(alias => alias.toLowerCase().includes(query))
      );
    });
  };
  
  const devicesData = getDevicesData();
  const entitiesData = getEntitiesData();
  const areasData = getAreasData();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Devices & Entities</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your Home Assistant devices, entities, and areas</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showDebug ? `bg-${colors.name}-600 text-white` : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Debug
          </button>
          <button
            onClick={() => {
              initializedRef.current = false; // Allow re-initialization
              refreshRegistries();
            }}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2 text-xs font-mono">
          <div className="text-slate-300 font-bold">🔍 Debug Information</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-slate-400">Subscription Active:</span>{' '}
              <span className={subscriptionActive ? 'text-green-400' : 'text-red-400'}>
                {subscriptionActive ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Entity States:</span>{' '}
              <span className="text-cyan-400">{Object.keys(statesByEntityId).length}</span>
            </div>
            <div>
              <span className="text-slate-400">Areas:</span>{' '}
              <span className="text-cyan-400">{areas.length}</span>
            </div>
            <div>
              <span className="text-slate-400">Devices:</span>{' '}
              <span className="text-cyan-400">{devices.length}</span>
            </div>
            <div>
              <span className="text-slate-400">Entity Registry:</span>{' '}
              <span className="text-cyan-400">{entityRegistry.length}</span>
            </div>
            <div>
              <span className="text-slate-400">Loading:</span>{' '}
              <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
                {loading ? '⏳ Yes' : '✅ No'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Devices Data:</span>{' '}
              <span className="text-cyan-400">{devicesData.length}</span>
            </div>
            <div>
              <span className="text-slate-400">Entities Data:</span>{' '}
              <span className="text-cyan-400">{entitiesData.length}</span>
            </div>
            <div>
              <span className="text-slate-400">Areas Data:</span>{' '}
              <span className="text-cyan-400">{areasData.length}</span>
            </div>
          </div>
          {error && (
            <div className="text-red-400 mt-2">
              ❌ Error: {error}
            </div>
          )}
        </div>
      )}

      {/* Error State */}
      {error && !showDebug && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div>
            <div className="text-red-400 font-semibold">Error loading data</div>
            <div className="text-red-300 text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'devices'
              ? `text-${colors.name}-400 border-b-2 border-${colors.name}-400`
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Devices ({devicesData.length})
        </button>
        <button
          onClick={() => setActiveTab('entities')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'entities'
              ? `text-${colors.name}-400 border-b-2 border-${colors.name}-400`
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <List className="w-4 h-4" />
          Entities ({entitiesData.length})
        </button>
        <button
          onClick={() => setActiveTab('areas')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'areas'
              ? `text-${colors.name}-400 border-b-2 border-${colors.name}-400`
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Areas ({areasData.length})
        </button>
      </div>

      {/* Tab Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
      )}

      {!loading && activeTab === 'devices' && (
        <DevicesTab
          devices={devicesData}
          colors={colors}
          onEditDevice={(device) => setDeviceEditModal({ isOpen: true, device })}
        />
      )}
      {!loading && activeTab === 'entities' && (
        <EntitiesTab
          entities={entitiesData}
          colors={colors}
          onEditEntity={(entity) => setEntityEditModal({ isOpen: true, entity })}
        />
      )}
      {!loading && activeTab === 'areas' && (
        <AreasTab
          areas={areasData}
          colors={colors}
          onEditArea={(area) => setAreaEditModal({ isOpen: true, area, isNew: false })}
          onCreateArea={() => setAreaEditModal({ isOpen: true, area: null, isNew: true })}
        />
      )}

      {/* Edit Modals */}
      <EntityEditModal
        isOpen={entityEditModal.isOpen}
        onClose={() => setEntityEditModal({ isOpen: false, entity: null })}
        entity={entityEditModal.entity}
      />
      <DeviceEditModal
        isOpen={deviceEditModal.isOpen}
        onClose={() => setDeviceEditModal({ isOpen: false, device: null })}
        device={deviceEditModal.device}
      />
      <AreaEditModal
        isOpen={areaEditModal.isOpen}
        onClose={() => setAreaEditModal({ isOpen: false, area: null, isNew: false })}
        area={areaEditModal.area}
        isNew={areaEditModal.isNew}
      />
    </div>
  );
};

// ============================================================================
// DEVICES TAB COMPONENT
// ============================================================================

const DevicesTab = ({ devices, colors, onEditDevice }) => {
  if (devices.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No devices found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map(device => (
        <div
          key={device.id}
          className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-slate-100 font-semibold">{device.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{device.manufacturer}</p>
            </div>
            <div className="flex items-center gap-2">
              {device.disabled && (
                <Power className="w-4 h-4 text-red-400" title="Disabled" />
              )}
              <button
                onClick={() => onEditDevice(device)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                title="Edit device"
              >
                <Edit className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Model:</span>
              <span className="text-slate-300">{device.model}</span>
            </div>
            {device.sw_version && (
              <div className="flex justify-between">
                <span className="text-slate-400">Version:</span>
                <span className="text-slate-300">{device.sw_version}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Area:</span>
              <span className={`${device.area_id ? 'text-cyan-400' : 'text-slate-500'}`}>
                {device.area}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Entities:</span>
              <span className="text-slate-300">{device.entityCount}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// ENTITIES TAB COMPONENT
// ============================================================================

const EntitiesTab = ({ entities, colors, onEditEntity }) => {
  if (entities.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No entities found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entities.map(entity => (
        <div
          key={entity.entity_id}
          className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-slate-100 font-medium">{entity.name}</h3>
                {entity.disabled && (
                  <span className="px-2 py-0.5 bg-red-900/30 text-red-400 text-xs rounded">
                    Disabled
                  </span>
                )}
                {entity.hidden && (
                  <EyeOff className="w-4 h-4 text-slate-500" title="Hidden" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">{entity.entity_id}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className={`text-sm font-semibold ${
                  entity.state === 'unavailable' ? 'text-red-400' : 'text-cyan-400'
                }`}>
                  {entity.state}
                </div>
                <div className="text-xs text-slate-500 mt-1">{entity.platform}</div>
              </div>
              <button
                onClick={() => onEditEntity(entity)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                title="Edit entity"
              >
                <Edit className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="w-3 h-3" />
              <span className={entity.area !== 'Unassigned' ? 'text-cyan-400' : 'text-slate-500'}>
                {entity.area}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// AREAS TAB COMPONENT
// ============================================================================

const AreasTab = ({ areas, colors, onEditArea, onCreateArea }) => {
  return (
    <div className="space-y-4">
      {/* Create Area Button */}
      <button
        onClick={onCreateArea}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-${colors.name}-600 text-white rounded-lg hover:bg-${colors.name}-700 transition-colors`}
      >
        <Plus className="w-5 h-5" />
        Create Area
      </button>

      {/* Areas Grid */}
      {areas.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No areas found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map(area => (
            <div
              key={area.area_id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-slate-100 font-semibold text-lg">{area.name}</h3>
                  {area.aliases.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      Aliases: {area.aliases.join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onEditArea(area)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  title="Edit area"
                >
                  <Edit className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Devices:</span>
                  <span className="text-cyan-400 font-semibold">{area.devicesCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Entities:</span>
                  <span className="text-cyan-400 font-semibold">{area.entitiesCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DevicesEntitiesView;

