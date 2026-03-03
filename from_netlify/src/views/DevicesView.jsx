/**
 * Devices, Entities & Areas Management View
 *
 * Manage devices, entities, and areas from Home Assistant.
 */

import React, { useState, useEffect } from 'react';
import { Smartphone, Lightbulb, MapPin, Search, RefreshCw, Settings, Plus } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';
import Card from '../components/Card';
import haClient from '../services/haClient';
import DevicePairingModal from '../components/settings/DevicePairingModal';

const DevicesView = () => {
  const { colors } = useAccentColor();
  const [activeTab, setActiveTab] = useState('devices'); // devices, entities, areas
  const [devices, setDevices] = useState([]);
  const [entities, setEntities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [pairingProtocol, setPairingProtocol] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all registries in parallel
      const [devicesData, entitiesData, areasData] = await Promise.all([
        haClient.callWS('config/device_registry/list'),
        haClient.callWS('config/entity_registry/list'),
        haClient.callWS('config/area_registry/list')
      ]);

      setDevices(devicesData || []);
      setEntities(entitiesData || []);
      setAreas(areasData || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePairDevice = (protocol) => {
    setPairingProtocol(protocol);
    setPairingModalOpen(true);
  };

  const handlePairingSuccess = () => {
    loadData();
  };

  const tabs = [
    { id: 'devices', label: 'Devices', icon: Smartphone, count: devices.length },
    { id: 'entities', label: 'Entities', icon: Lightbulb, count: entities.length },
    { id: 'areas', label: 'Areas', icon: MapPin, count: areas.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-slate-200">Devices & Entities</h1>
          <p className={`text-sm ${colors.text} mt-1`}>Manage your smart home devices and entities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button
              className={`p-3 bg-${colors.name}-600 hover:bg-${colors.name}-700 rounded-lg transition-colors`}
              title="Pair Device"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
            {/* Dropdown menu for pairing options */}
            <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button
                onClick={() => handlePairDevice('matter')}
                className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-t-lg transition-colors"
              >
                Pair Matter Device
              </button>
              <button
                onClick={() => handlePairDevice('zha')}
                className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Pair Zigbee Device
              </button>
              <button
                onClick={() => handlePairDevice('esphome')}
                className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-b-lg transition-colors"
              >
                Discover ESPHome
              </button>
            </div>
          </div>
          <button
            onClick={loadData}
            className={`p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors`}
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${colors.text}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? `border-${colors.name}-500 ${colors.text}`
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id
                  ? `bg-${colors.name}-500/20 ${colors.text}`
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'devices' && (
            <DevicesTab devices={devices} searchQuery={searchQuery} areas={areas} colors={colors} />
          )}
          {activeTab === 'entities' && (
            <EntitiesTab entities={entities} searchQuery={searchQuery} devices={devices} areas={areas} colors={colors} />
          )}
          {activeTab === 'areas' && (
            <AreasTab areas={areas} searchQuery={searchQuery} devices={devices} entities={entities} colors={colors} />
          )}
        </>
      )}

      {/* Pairing Modal */}
      <DevicePairingModal
        isOpen={pairingModalOpen}
        onClose={() => setPairingModalOpen(false)}
        protocol={pairingProtocol}
        onSuccess={handlePairingSuccess}
      />
    </div>
  );
};

/**
 * Devices Tab
 */
const DevicesTab = ({ devices, searchQuery, areas, colors }) => {
  const filtered = devices.filter(device =>
    device.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAreaName = (areaId) => {
    const area = areas.find(a => a.area_id === areaId);
    return area?.name || 'No area';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((device) => (
        <Card key={device.id} className="hover:border-slate-600 transition-colors">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-slate-200 font-medium">{device.name || 'Unnamed Device'}</h3>
                <p className="text-sm text-slate-500 mt-1">{device.manufacturer || 'Unknown'}</p>
              </div>
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <Settings className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {device.model && (
              <p className="text-xs text-slate-600">{device.model}</p>
            )}

            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span className="text-slate-400">{getAreaName(device.area_id)}</span>
            </div>

            {device.sw_version && (
              <div className="text-xs text-slate-600">
                Version: {device.sw_version}
              </div>
            )}
          </div>
        </Card>
      ))}
      {filtered.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-500">
          No devices found
        </div>
      )}
    </div>
  );
};

/**
 * Entities Tab
 */
const EntitiesTab = ({ entities, searchQuery, devices, areas, colors }) => {
  const filtered = entities.filter(entity =>
    entity.entity_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entity.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entity.original_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDeviceName = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    return device?.name || 'No device';
  };

  return (
    <div className="space-y-2">
      {filtered.map((entity) => (
        <div
          key={entity.entity_id}
          className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-slate-200 font-medium">
                {entity.name || entity.original_name || entity.entity_id}
              </h3>
              {entity.disabled_by && (
                <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                  Disabled
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
              <span>{entity.entity_id}</span>
              <span>•</span>
              <span>{entity.platform}</span>
              {entity.device_id && (
                <>
                  <span>•</span>
                  <span>{getDeviceName(entity.device_id)}</span>
                </>
              )}
            </div>
          </div>
          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
            <Settings className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      ))}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          No entities found
        </div>
      )}
    </div>
  );
};

/**
 * Areas Tab
 */
const AreasTab = ({ areas, searchQuery, devices, entities, colors }) => {
  const filtered = areas.filter(area =>
    area.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAreaDeviceCount = (areaId) => {
    return devices.filter(d => d.area_id === areaId).length;
  };

  const getAreaEntityCount = (areaId) => {
    return entities.filter(e => e.area_id === areaId).length;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filtered.map((area) => (
        <Card key={area.area_id} className="hover:border-slate-600 transition-colors">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-slate-200 font-medium text-lg">{area.name}</h3>
                {area.aliases?.length > 0 && (
                  <p className="text-sm text-slate-500 mt-1">
                    Aliases: {area.aliases.join(', ')}
                  </p>
                )}
              </div>
              <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <Settings className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">{getAreaDeviceCount(area.area_id)} devices</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-slate-500" />
                <span className="text-slate-400">{getAreaEntityCount(area.area_id)} entities</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
      {filtered.length === 0 && (
        <div className="col-span-full text-center py-12 text-slate-500">
          No areas found
        </div>
      )}
    </div>
  );
};

export default DevicesView;
