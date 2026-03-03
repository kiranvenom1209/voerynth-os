import React, { useMemo } from 'react';
import { Smartphone, Edit, Power, MapPin } from 'lucide-react';
import { useAccentColor } from '../../../context/AccentColorContext';
import { useSettingsNav } from '../../SettingsView';
import useHAStore from '../../../stores/haStore';

/**
 * Replace "Home Assistant" in device/manufacturer names
 */
const sanitizeDeviceName = (name) => {
  if (!name) return name;
  return name
    .replace(/Home Assistant Core/gi, 'System Core')
    .replace(/Home Assistant Supervisor/gi, 'System Supervisor')
    .replace(/Home Assistant Operating System/gi, 'Voerynth OS')
    .replace(/Home Assistant Host/gi, 'System Host')
    .replace(/Home Assistant/gi, 'System');
};

/**
 * Devices Tab
 * Shows all devices with navigation to device detail pages
 */
const DevicesTab = () => {
  const { colors } = useAccentColor();
  const { navigate } = useSettingsNav();

  const { devices, areasById, entityRegistry, loading } = useHAStore();

  // Process devices with area names and entity counts
  const devicesData = useMemo(() => {
    return devices.map(device => {
      const area = device.area_id ? areasById[device.area_id] : null;
      const entityCount = entityRegistry.filter(e => e.device_id === device.id).length;

      const rawName = device.name_by_user || device.name || 'Unnamed Device';
      const rawManufacturer = device.manufacturer || '';
      const rawModel = device.model || '';

      return {
        ...device,
        area: area?.name || 'Unassigned',
        entityCount,
        name: sanitizeDeviceName(rawName),
        manufacturer: sanitizeDeviceName(rawManufacturer),
        model: sanitizeDeviceName(rawModel)
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [devices, areasById, entityRegistry]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading devices...</div>
      </div>
    );
  }

  if (devicesData.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No devices found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devicesData.map(device => (
        <button
          key={device.id}
          onClick={() => navigate(`/settings/devices-services/device/${device.id}`)}
          className="group bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-cyan-500/50 transition-all text-left"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-slate-100 font-semibold group-hover:text-cyan-400 transition-colors">
                {device.name}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{device.manufacturer}</p>
            </div>
            {device.disabled && (
              <Power className="w-4 h-4 text-red-400" title="Disabled" />
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Model:</span>
              <span className="text-slate-300">{sanitizeDeviceName(device.model)}</span>
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
        </button>
      ))}
    </div>
  );
};

export default DevicesTab;

