import React, { createContext, useContext, useState, useRef, useCallback, useMemo, useEffect } from 'react';
import HAConnection from '../services/HAConnection';
import * as storage from '../utils/storage';

const HomeAssistantContext = createContext(null);

export const HomeAssistantProvider = ({ children, onConnectionChange, onSplashSequence }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [hassStates, setHassStates] = useState({});
  const [systemRestarting, setSystemRestarting] = useState(false);
  const connectionRef = useRef(null);
  const manualDisconnectRef = useRef(false);

  // Connect to Control Hub
  const connect = useCallback(async (url, token, callbacks = {}) => {
    setConnectionStatus('connecting');

    if (connectionRef.current) {
      connectionRef.current.disconnect();
    }

    connectionRef.current = new HAConnection(
      url,
      token,
      (newStates) => setHassStates(newStates),
      async () => {
        setConnectionStatus('connected');
        // Use persistent storage for Capacitor apps
        await storage.setItem('voerynth_ha_url', url);
        await storage.setItem('voerynth_ha_token', token);

        if (systemRestarting) {
          setSystemRestarting(false);
        }

        // Expose HAConnection globally for haClient
        window.__haConnection = connectionRef.current;

        // Notify parent about successful connection
        if (onConnectionChange) {
          onConnectionChange('connected');
        }

        // Trigger splash sequence callback
        if (callbacks.onConnected) {
          callbacks.onConnected();
        }
      },
      () => {
        setConnectionStatus('disconnected');
        if (onConnectionChange) {
          onConnectionChange('disconnected');
        }
      }
    );

    connectionRef.current.connect();
  }, [systemRestarting, onConnectionChange]);

  // Disconnect from Control Hub
  const disconnect = useCallback(async () => {
    manualDisconnectRef.current = true;

    if (connectionRef.current) {
      connectionRef.current.disconnect();
    }

    // Use persistent storage for Capacitor apps
    await storage.removeItem('voerynth_ha_url');
    await storage.removeItem('voerynth_ha_token');
    setHassStates({});
    setConnectionStatus('disconnected');
  }, []);

  // Call a Control Hub service
  const callService = useCallback(async (domain, service, data) => {
    if (connectionRef.current && connectionRef.current.connected) {
      return await connectionRef.current.callService(domain, service, data);
    } else {
      console.warn("Not connected to Control Hub, service call skipped:", domain, service);
      throw new Error('Not connected to Control Hub');
    }
  }, []);

  // Check if any lights are on
  const areAnyLightsOn = useCallback(() => {
    if (!hassStates || Object.keys(hassStates).length === 0) return false;

    return Object.entries(hassStates).some(([entityId, state]) => {
      return entityId.startsWith('light.') && state?.state === 'on';
    });
  }, [hassStates]);

  // Check if BOTH bedroom AND bathroom lights are on together (nighttime scenario)
  const areOnlyBedroomBathroomLightsOn = useCallback(() => {
    if (!hassStates || Object.keys(hassStates).length === 0) return false;

    // Check if it's dark outside (sun below horizon)
    const sunEntity = hassStates['sun.sun'];
    const isDarkOutside = sunEntity?.state === 'below_horizon';

    // Bedroom light entity IDs
    const bedroomLights = [
      'light.bedroom',
      'light.bedroom_light',
      'light.l_bedside_lamp'
    ];

    // Bathroom light entity ID
    const bathroomLight = 'light.bathroom';

    // Get all lights that are on
    const allLightsOn = Object.entries(hassStates).filter(([entityId, state]) => {
      return entityId.startsWith('light.') && state?.state === 'on';
    });

    // Check if at least one bedroom light is on
    const bedroomOn = allLightsOn.some(([entityId]) => bedroomLights.includes(entityId));

    // Check if bathroom light is on
    const bathroomOn = allLightsOn.some(([entityId]) => entityId === bathroomLight);

    // Check if ONLY bedroom and bathroom lights are on (no other lights)
    const onlyBedroomBathroom = allLightsOn.every(([entityId]) => {
      return bedroomLights.includes(entityId) || entityId === bathroomLight;
    });

    // Nighttime mode: Dark outside + BOTH bedroom AND bathroom are on + NO other lights
    const isNighttime = isDarkOutside && bedroomOn && bathroomOn && onlyBedroomBathroom;

    // Debug logging
    if (allLightsOn.length > 0) {
      console.log('💡 All lights ON:', allLightsOn.map(([id]) => id));
      console.log('🌅 Sun position:', sunEntity?.state || 'unknown');
      console.log('🌑 Dark outside:', isDarkOutside);
      console.log('🛏️ Bedroom ON:', bedroomOn);
      console.log('🚿 Bathroom ON:', bathroomOn);
      console.log('🌙 Nighttime mode (dark + both + no others):', isNighttime);
    }

    return isNighttime;
  }, [hassStates]);

  // Get saved credentials
  const getSavedCredentials = useCallback(async () => {
    const url = await storage.getItem('voerynth_ha_url');
    const token = await storage.getItem('voerynth_ha_token');
    return { url, token };
  }, []);

  // Check if we should auto-connect
  const shouldAutoConnect = useCallback(async () => {
    const { url, token } = await getSavedCredentials();
    return url && token && !manualDisconnectRef.current;
  }, [getSavedCredentials]);

  const value = useMemo(() => ({
    // State
    connectionStatus,
    hassStates,
    systemRestarting,

    // Actions
    connect,
    disconnect,
    callService,
    setSystemRestarting,

    // Helpers
    areAnyLightsOn,
    areOnlyBedroomBathroomLightsOn,
    getSavedCredentials,
    shouldAutoConnect,

    // Refs (for advanced usage)
    isManualDisconnect: () => manualDisconnectRef.current,
    setManualDisconnect: (value) => { manualDisconnectRef.current = value; },
    getHAConnection: () => connectionRef.current
  }), [
    connectionStatus,
    hassStates,
    systemRestarting,
    connect,
    disconnect,
    callService,
    areAnyLightsOn,
    areOnlyBedroomBathroomLightsOn,
    getSavedCredentials,
    shouldAutoConnect
  ]);

  return (
    <HomeAssistantContext.Provider value={value}>
      {children}
    </HomeAssistantContext.Provider>
  );
};

// Custom hook for using Control Hub context
export const useHomeAssistant = () => {
  const context = useContext(HomeAssistantContext);
  if (!context) {
    throw new Error('useHomeAssistant must be used within a HomeAssistantProvider');
  }
  return context;
};

// Convenience hook for getting entity state
export const useHassEntity = (entityId, mockData = {}) => {
  const { hassStates } = useHomeAssistant();
  
  const entity = hassStates[entityId];
  if (entity) {
    return {
      state: entity.state,
      attributes: entity.attributes || {},
      entity_picture: entity.attributes?.entity_picture,
      isUnavailable: entity.state === 'unavailable' || entity.state === 'unknown',
      lastUpdated: new Date(entity.last_updated)
    };
  }
  
  return {
    ...mockData,
    attributes: mockData.attributes || {},
    isUnavailable: true,
    isMock: true
  };
};

export default HomeAssistantContext;

