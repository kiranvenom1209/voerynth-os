/**
 * Settings View
 *
 * Main settings navigation with internal routing for Settings pages
 */

import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { useHomeAssistant } from '../context/HomeAssistantContext';
import useHAStore from '../stores/haStore';
import haClient from '../services/haClient';
import SettingsHome from './settings/SettingsHome';
import DevicesServicesView from './settings/DevicesServicesView';
import AutomationsView from './settings/AutomationsView';
import AreasView from './settings/AreasView';
import PeopleView from './settings/PeopleView';
import AddonsView from './settings/AddonsView';
import SystemView from './settings/SystemView';
import IntegrationDetailView from './settings/IntegrationDetailView';
import DeviceDetailView from './settings/DeviceDetailView';
import EntityDetailView from './settings/EntityDetailView';

// Settings Navigation Context
const SettingsNavContext = createContext();

export const useSettingsNav = () => {
  const context = useContext(SettingsNavContext);
  if (!context) {
    throw new Error('useSettingsNav must be used within SettingsView');
  }
  return context;
};

const SettingsView = () => {
  const [currentPath, setCurrentPath] = useState('/settings');
  const [pathParams, setPathParams] = useState({});
  const initializedRef = useRef(false);

  const { hassStates, connectionStatus, getHAConnection } = useHomeAssistant();
  const { initialize, loading } = useHAStore();

  // Set up HAClient with existing connection - ONLY RUN ONCE (same pattern as DevicesEntitiesView)
  useEffect(() => {
    // Prevent infinite loop - only initialize once
    if (initializedRef.current) {
      console.log('⏭️ SettingsView: Already initialized, skipping');
      return;
    }

    const haConnection = getHAConnection();
    console.log('🔍 SettingsView useEffect triggered - connection:', haConnection?.connected, 'states:', Object.keys(hassStates || {}).length);

    if (haConnection && haConnection.connected && hassStates && Object.keys(hassStates).length > 0) {
      console.log('🔌 SettingsView: Setting up HAClient with existing connection');
      haClient.setHAConnection(haConnection);

      console.log('📊 SettingsView: Calling initialize with', Object.keys(hassStates).length, 'states');
      initializedRef.current = true; // Mark as initialized

      initialize(hassStates).catch(err => {
        console.error('❌ SettingsView: Initialize failed:', err);
        initializedRef.current = false; // Reset on error so we can retry
      });
    } else {
      console.log('⚠️ SettingsView: HAConnection not ready or no states available');
    }
  }, [connectionStatus, hassStates, getHAConnection, initialize]);

  // Navigation function
  const navigate = (path, params = {}) => {
    setCurrentPath(path);
    setPathParams(params);
  };

  // Parse current route
  const renderRoute = () => {
    if (currentPath === '/settings') {
      return <SettingsHome />;
    }

    if (currentPath === '/settings/devices-services') {
      return <DevicesServicesView />;
    }

    if (currentPath === '/settings/automations') {
      return <AutomationsView />;
    }

    if (currentPath === '/settings/areas') {
      return <AreasView />;
    }

    if (currentPath === '/settings/people') {
      return <PeopleView />;
    }

    if (currentPath === '/settings/addons') {
      return <AddonsView />;
    }

    if (currentPath === '/settings/system') {
      return <SystemView />;
    }

    if (currentPath.startsWith('/settings/devices-services/integration/')) {
      const domain = currentPath.split('/').pop();
      return <IntegrationDetailView domain={domain} />;
    }

    if (currentPath.startsWith('/settings/devices-services/device/')) {
      const deviceId = currentPath.split('/').pop();
      return <DeviceDetailView deviceId={deviceId} />;
    }

    if (currentPath.startsWith('/settings/devices-services/entity/')) {
      const entityId = currentPath.split('/').pop();
      return <EntityDetailView entityId={entityId} />;
    }

    // Default fallback
    return <SettingsHome />;
  };

  return (
    <SettingsNavContext.Provider value={{ navigate, currentPath, pathParams }}>
      <div className="space-y-6">
        {renderRoute()}
      </div>
    </SettingsNavContext.Provider>
  );
};

export default SettingsView;

