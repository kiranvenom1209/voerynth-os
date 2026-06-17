/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from 'react';
import HAConnection from '../services/HAConnection';
import haClient from '../services/haClient';
import * as storage from '../utils/storage';
import { createHassEntityShape } from '../utils/hakitEntity';
import estateEntities from '../config/estateEntities';

const HomeAssistantContext = createContext(null);

const idleConnectionStage = {
  id: 'idle',
  message: 'Control Hub idle',
  detail: 'Waiting for a connection request',
  progress: 0,
};

export const HomeAssistantProvider = ({ children, onConnectionChange }) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState(null);
  const [connectionStage, setConnectionStage] = useState(idleConnectionStage);
  const [hassStates, setHassStates] = useState({});
  const [systemRestarting, setSystemRestarting] = useState(false);
  const connectionRef = useRef(null);
  const manualDisconnectRef = useRef(false);

  // Connect to Control Hub
  const connect = useCallback(async (url, token, callbacks = {}) => {
    manualDisconnectRef.current = false;
    setConnectionStatus('connecting');
    setConnectionError(null);
    setConnectionStage({
      id: 'preparing',
      message: 'Preparing Control Hub connection',
      detail: 'Checking saved URL and access token',
      progress: 14,
    });

    const normalizedUrl = url.replace(/\/$/, '');
    const existingConnection = connectionRef.current;
    if (
      existingConnection &&
      existingConnection.url === normalizedUrl &&
      existingConnection.token === token &&
      (existingConnection.connected || existingConnection.connecting)
    ) {
      setConnectionStage(existingConnection.connected ? {
        id: 'ready',
        message: 'Control Hub online',
        detail: 'Existing websocket is already active',
        progress: 100,
      } : {
        id: 'starting',
        message: 'Control Hub connection already in progress',
        detail: existingConnection.hassUrl,
        progress: 22,
      });
      setConnectionStatus(existingConnection.connected ? 'connected' : 'connecting');
      return;
    }

    if (connectionRef.current) {
      await connectionRef.current.disconnect();
    }

    let hasCompletedInitialConnect = false;

    connectionRef.current = new HAConnection(
      normalizedUrl,
      token,
      (newStates) => setHassStates(newStates),
      async () => {
        const isInitialConnect = !hasCompletedInitialConnect;
        hasCompletedInitialConnect = true;
        setConnectionStatus('connected');
        setConnectionError(null);
        // Use persistent storage for Capacitor apps
        if (isInitialConnect) {
          await storage.setItem('voerynth_ha_url', normalizedUrl);
          await storage.setItem('voerynth_ha_token', token);
        }

        if (systemRestarting) {
          setSystemRestarting(false);
        }

        // Expose HAConnection globally for haClient
        window.__haConnection = connectionRef.current;
        haClient.setHAConnection(connectionRef.current);

        // Notify parent about successful connection
        if (onConnectionChange) {
          onConnectionChange('connected');
        }

        // Trigger splash sequence callback
        if (isInitialConnect && callbacks.onConnected) {
          callbacks.onConnected();
        }
      },
      (error) => {
        setConnectionError(error?.message || null);
        setConnectionStage({
          id: 'failed',
          message: 'Control Hub connection failed',
          detail: error?.message || 'Unable to reach the Control Hub',
          progress: 100,
        });
        setConnectionStatus('disconnected');
        if (onConnectionChange) {
          onConnectionChange('disconnected');
        }
      },
      (stage) => setConnectionStage(stage)
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
    setConnectionError(null);
    setConnectionStage(idleConnectionStage);
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
    const sunEntity = hassStates[estateEntities.weather.sun];
    const isDarkOutside = sunEntity?.state === 'below_horizon';

    // Bedroom light entity IDs
    const bedroomRoom = estateEntities.lights.rooms.find((room) => room.name === 'Bedroom');
    const bedroomLights = bedroomRoom?.lights.map((light) => light.id) || [];

    // Bathroom light entity ID
    const sanctuaryRoom = estateEntities.lights.rooms.find((room) => room.name === 'Sanctuary');
    const bathroomLight = sanctuaryRoom?.lights[0]?.id || 'light.bathroom';

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

  const clearConnectionError = useCallback(() => {
    setConnectionError(null);
  }, []);

  const retryConnection = useCallback(async () => {
    const { url, token } = await getSavedCredentials();
    if (!url || !token) {
      throw new Error('Saved Control Hub credentials are missing');
    }
    return connect(url, token);
  }, [connect, getSavedCredentials]);

  // Check if we should auto-connect
  const shouldAutoConnect = useCallback(async () => {
    const { url, token } = await getSavedCredentials();
    return url && token && !manualDisconnectRef.current;
  }, [getSavedCredentials]);

  const isManualDisconnect = useCallback(() => manualDisconnectRef.current, []);

  const setManualDisconnect = useCallback((value) => {
    manualDisconnectRef.current = value;
  }, []);

  const getHAConnection = useCallback(() => connectionRef.current, []);

  const value = useMemo(() => ({
    // State
    connectionStatus,
    connectionError,
    connectionStage,
    hassStates,
    systemRestarting,

    // Actions
    connect,
    disconnect,
    callService,
    setSystemRestarting,
    clearConnectionError,
    retryConnection,

    // Helpers
    areAnyLightsOn,
    areOnlyBedroomBathroomLightsOn,
    getSavedCredentials,
    shouldAutoConnect,

    // Refs (for advanced usage)
    isManualDisconnect,
    setManualDisconnect,
    getHAConnection
  }), [
    connectionStatus,
    connectionError,
    connectionStage,
    hassStates,
    systemRestarting,
    connect,
    disconnect,
    callService,
    clearConnectionError,
    retryConnection,
    areAnyLightsOn,
    areOnlyBedroomBathroomLightsOn,
    getSavedCredentials,
    shouldAutoConnect,
    isManualDisconnect,
    setManualDisconnect,
    getHAConnection
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
  return createHassEntityShape(entityId, hassStates[entityId], mockData);
};

export default HomeAssistantContext;
