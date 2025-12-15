import { create } from 'zustand';
import haClient from '../services/haClient';

/**
 * Global System State Store
 *
 * This store maintains the complete system state using registries
 * and state subscriptions from the existing connection.
 */
const useHAStore = create((set, get) => ({
  // ============================================================================
  // RAW DATA (from backend)
  // ============================================================================
  
  // Entity states (from subscribeEntities) - continuously updated
  statesByEntityId: {},
  
  // Registries (from config/*/list WS commands)
  areas: [],
  devices: [],
  entityRegistry: [],
  configEntries: [], // Integration config entries
  
  // ============================================================================
  // DERIVED MAPS (for fast lookups)
  // ============================================================================
  
  areasById: {},
  devicesById: {},
  entityRegByEntityId: {},
  configEntriesById: {},
  configEntriesByDomain: {}, // Grouped by integration domain
  
  // ============================================================================
  // LOADING/ERROR STATE
  // ============================================================================
  
  loading: false,
  error: null,
  subscriptionActive: false,
  
  // ============================================================================
  // ACTIONS
  // ============================================================================
  
  /**
   * Initialize the store - fetch all registries and set up state subscription
   * @param {object} hassStates - Current HA states from HomeAssistantContext
   */
  initialize: async (hassStates = {}) => {
    console.log('🚀 Initialize called with', Object.keys(hassStates).length, 'states');
    set({ loading: true, error: null });

    try {
      if (!haClient.haConnection || !haClient.haConnection.connected) {
        console.error('❌ HAConnection not available or not connected');
        throw new Error('Home Assistant not connected');
      }

      console.log('🔌 Initializing HA Store...');

      // 1. Use existing states from HAConnection
      console.log('📊 Using existing entity states:', Object.keys(hassStates).length, 'entities');
      set({ statesByEntityId: hassStates, subscriptionActive: true });

      // 2. Fetch all registries in parallel
      console.log('📋 Fetching registries...');

      let areas, devices, entityRegistry, configEntries;
      try {
        [areas, devices, entityRegistry, configEntries] = await Promise.all([
          haClient.callWS('config/area_registry/list'),
          haClient.callWS('config/device_registry/list'),
          haClient.callWS('config/entity_registry/list'),
          haClient.callWS('config_entries/get'),
        ]);
      } catch (wsError) {
        console.error('❌ WebSocket call failed:', wsError);
        throw wsError;
      }

      console.log('✅ Registries loaded:', {
        areas: areas?.length || 0,
        devices: devices?.length || 0,
        entities: entityRegistry?.length || 0,
        configEntries: configEntries?.length || 0,
      });

      // Validate responses
      if (!Array.isArray(areas) || !Array.isArray(devices) || !Array.isArray(entityRegistry)) {
        console.error('❌ Invalid registry response format:', { areas, devices, entityRegistry });
        throw new Error('Invalid registry response format');
      }

      // 3. Build lookup maps
      const areasById = {};
      areas.forEach(area => {
        areasById[area.area_id] = area;
      });

      const devicesById = {};
      devices.forEach(device => {
        devicesById[device.id] = device;
      });

      const entityRegByEntityId = {};
      entityRegistry.forEach(entity => {
        entityRegByEntityId[entity.entity_id] = entity;
      });

      // Build config entries maps
      const configEntriesById = {};
      const configEntriesByDomain = {};

      if (Array.isArray(configEntries)) {
        configEntries.forEach(entry => {
          configEntriesById[entry.entry_id] = entry;

          // Group by domain
          if (!configEntriesByDomain[entry.domain]) {
            configEntriesByDomain[entry.domain] = [];
          }
          configEntriesByDomain[entry.domain].push(entry);
        });
      }

      console.log('✅ Setting store data and clearing loading state');
      set({
        areas,
        devices,
        entityRegistry,
        configEntries: configEntries || [],
        areasById,
        devicesById,
        entityRegByEntityId,
        configEntriesById,
        configEntriesByDomain,
        loading: false,
      });
      console.log('✅ Store initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize HA store:', error);
      console.error('❌ Error stack:', error.stack);
      set({ error: error.message, loading: false });
    }
  },

  /**
   * Update entity states (called when HomeAssistantContext updates)
   * @param {object} hassStates - New HA states
   */
  updateStates: (hassStates) => {
    set({ statesByEntityId: hassStates });
  },
  
  /**
   * Refresh registries (for manual refresh button)
   */
  refreshRegistries: async () => {
    try {
      console.log('🔄 Refreshing registries...');
      const [areas, devices, entityRegistry, configEntries] = await Promise.all([
        haClient.callWS('config/area_registry/list'),
        haClient.callWS('config/device_registry/list'),
        haClient.callWS('config/entity_registry/list'),
        haClient.callWS('config_entries/get'),
      ]);

      // Rebuild lookup maps
      const areasById = {};
      areas.forEach(area => {
        areasById[area.area_id] = area;
      });

      const devicesById = {};
      devices.forEach(device => {
        devicesById[device.id] = device;
      });

      const entityRegByEntityId = {};
      entityRegistry.forEach(entity => {
        entityRegByEntityId[entity.entity_id] = entity;
      });

      // Rebuild config entries maps
      const configEntriesById = {};
      const configEntriesByDomain = {};

      if (Array.isArray(configEntries)) {
        configEntries.forEach(entry => {
          configEntriesById[entry.entry_id] = entry;

          if (!configEntriesByDomain[entry.domain]) {
            configEntriesByDomain[entry.domain] = [];
          }
          configEntriesByDomain[entry.domain].push(entry);
        });
      }

      set({
        areas,
        devices,
        entityRegistry,
        configEntries: configEntries || [],
        areasById,
        devicesById,
        entityRegByEntityId,
        configEntriesById,
        configEntriesByDomain,
      });

      console.log('✅ Registries refreshed');
    } catch (error) {
      console.error('❌ Failed to refresh registries:', error);
      set({ error: error.message });
    }
  },
  
  /**
   * Remove a device
   * @param {string} deviceId - Device ID to remove
   */
  removeDevice: async (deviceId) => {
    try {
      console.log('🗑️ Removing device:', deviceId);

      // Call Home Assistant to remove the device
      await haClient.callWS('config/device_registry/remove_config_entry_from_device', {
        device_id: deviceId,
      });

      // Refresh registries to update the UI
      await get().refreshRegistries();

      console.log('✅ Device removed successfully');
    } catch (error) {
      console.error('❌ Failed to remove device:', error);
      throw error;
    }
  },

  /**
   * Reset the store
   */
  reset: () => {
    set({
      statesByEntityId: {},
      areas: [],
      devices: [],
      entityRegistry: [],
      configEntries: [],
      areasById: {},
      devicesById: {},
      entityRegByEntityId: {},
      configEntriesById: {},
      configEntriesByDomain: {},
      loading: false,
      error: null,
      subscriptionActive: false,
    });
  },

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get integration statistics (device count, entity count per domain)
   * @param {string} domain - Integration domain
   * @returns {object} { deviceCount, entityCount, entries }
   */
  getIntegrationStats: (domain) => {
    const state = get();
    const entries = state.configEntriesByDomain[domain] || [];

    // Get all entry IDs for this domain
    const entryIds = entries.map(e => e.entry_id);

    // Count devices that belong to these entries
    const deviceCount = state.devices.filter(device =>
      device.config_entries && device.config_entries.some(id => entryIds.includes(id))
    ).length;

    // Count entities that belong to these entries
    const entityCount = state.entityRegistry.filter(entity =>
      entity.config_entry_id && entryIds.includes(entity.config_entry_id)
    ).length;

    return {
      deviceCount,
      entityCount,
      entries,
      entryCount: entries.length
    };
  },

  // ============================================================================
  // REGISTRY UPDATE ACTIONS (HA-style editing)
  // ============================================================================

  /**
   * Update an entity in the registry
   * @param {string} entity_id - Entity ID to update
   * @param {object} updates - Fields to update (name, icon, area_id, new_entity_id, etc.)
   * @returns {Promise<object>} Updated entity
   */
  updateEntity: async (entity_id, updates) => {
    try {
      console.log('📝 Updating entity:', entity_id, updates);

      // Build payload - only include fields that are being changed
      const payload = {
        type: 'config/entity_registry/update',
        entity_id,
        ...updates,
      };

      const result = await haClient.callWS('config/entity_registry/update', payload);
      console.log('✅ Entity updated:', result);

      // Refresh registries to get updated data
      await get().refreshRegistries();

      return result;
    } catch (error) {
      console.error('❌ Failed to update entity:', error);
      throw error;
    }
  },

  /**
   * Update a device in the registry
   * @param {string} device_id - Device ID to update
   * @param {object} updates - Fields to update (name_by_user, area_id, etc.)
   * @returns {Promise<object>} Updated device
   */
  updateDevice: async (device_id, updates) => {
    try {
      console.log('📝 Updating device:', device_id, updates);

      const payload = {
        type: 'config/device_registry/update',
        device_id,
        ...updates,
      };

      const result = await haClient.callWS('config/device_registry/update', payload);
      console.log('✅ Device updated:', result);

      // Refresh registries to get updated data
      await get().refreshRegistries();

      return result;
    } catch (error) {
      console.error('❌ Failed to update device:', error);
      throw error;
    }
  },

  /**
   * Create a new area
   * @param {object} areaData - Area data (name, aliases, picture, icon, etc.)
   * @returns {Promise<object>} Created area
   */
  createArea: async (areaData) => {
    try {
      console.log('📝 Creating area:', areaData);

      const payload = {
        type: 'config/area_registry/create',
        ...areaData,
      };

      const result = await haClient.callWS('config/area_registry/create', payload);
      console.log('✅ Area created:', result);

      // Refresh registries to get updated data
      await get().refreshRegistries();

      return result;
    } catch (error) {
      console.error('❌ Failed to create area:', error);
      throw error;
    }
  },

  /**
   * Update an area in the registry
   * @param {string} area_id - Area ID to update
   * @param {object} updates - Fields to update (name, aliases, picture, icon, etc.)
   * @returns {Promise<object>} Updated area
   */
  updateArea: async (area_id, updates) => {
    try {
      console.log('📝 Updating area:', area_id, updates);

      const payload = {
        type: 'config/area_registry/update',
        area_id,
        ...updates,
      };

      const result = await haClient.callWS('config/area_registry/update', payload);
      console.log('✅ Area updated:', result);

      // Refresh registries to get updated data
      await get().refreshRegistries();

      return result;
    } catch (error) {
      console.error('❌ Failed to update area:', error);
      throw error;
    }
  },

  /**
   * Delete an area from the registry
   * @param {string} area_id - Area ID to delete
   * @returns {Promise<void>}
   */
  deleteArea: async (area_id) => {
    try {
      console.log('🗑️ Deleting area:', area_id);

      const payload = {
        type: 'config/area_registry/delete',
        area_id,
      };

      await haClient.callWS('config/area_registry/delete', payload);
      console.log('✅ Area deleted');

      // Refresh registries to get updated data
      await get().refreshRegistries();
    } catch (error) {
      console.error('❌ Failed to delete area:', error);
      throw error;
    }
  },
}));

export default useHAStore;

