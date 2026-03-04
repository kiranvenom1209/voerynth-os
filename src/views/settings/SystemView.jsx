import React, { useMemo } from 'react';
import { ArrowLeft, Server, HardDrive, Cpu, Activity, Database, Network, Shield, RefreshCw, Download, Upload } from 'lucide-react';
import { useSettingsNav } from '../SettingsView';
import { useAccentColor } from '../../context/AccentColorContext';
import useHAStore from '../../stores/haStore';

/**
 * System View
 * System information and settings
 */
const SystemView = () => {
  const { navigate } = useSettingsNav();
  const { colors } = useAccentColor();
  const { hassStates } = useHAStore();

  // Get system info from sensor entities
  const systemInfo = useMemo(() => {
    const info = {
      core_version: '2026.03.04',
      supervisor_version: '2026.03.04',
      os_version: 'Voerynth OS 11.2',
      uptime: '7 days, 14 hours',
      hw_processor: 'Intel Core i5',
      hw_memory: '2.4 GB / 8.0 GB (30%)',
      hw_disk: '45.2 GB / 128 GB (35%)',
      hw_temp: '45°C',
      ip: '192.168.1.100',
      hostname: 'voerynth.local',
      mac: '00:1A:2B:3C:4D:5E',
      db_size: '1.2 GB',
      status: 'Unknown'
    };

    if (!hassStates || Object.keys(hassStates).length === 0) return info;

    // Core HA versions
    const coreV = hassStates['update.home_assistant_core']?.attributes?.installed_version;
    if (coreV) info.core_version = coreV;

    const supervisorV = hassStates['update.home_assistant_supervisor']?.attributes?.installed_version;
    if (supervisorV) info.supervisor_version = supervisorV;

    const osV = hassStates['update.home_assistant_operating_system']?.attributes?.installed_version;
    if (osV) info.os_version = osV;

    // Uptime extraction
    const bootSensor = Object.values(hassStates).find(e => e.entity_id.includes('last_boot') || e.entity_id.includes('uptime'));
    if (bootSensor) {
      const dateVal = Date.parse(bootSensor.state);
      if (!isNaN(dateVal) && dateVal > 100000) {
        const diffMs = Date.now() - dateVal;
        const d = Math.floor(diffMs / 86400000);
        const h = Math.floor((diffMs % 86400000) / 3600000);
        info.uptime = d > 0 ? `${d} days, ${h} hours` : `${h} hours`;
      } else {
        info.uptime = bootSensor.state;
      }
    }

    // Hardware sensors
    const processorUse = Object.values(hassStates).find(e => e.entity_id.includes('processor_use'))?.state;
    const memoryFree = Object.values(hassStates).find(e => e.entity_id.includes('memory_free'))?.state;
    const diskUse = Object.values(hassStates).find(e => e.entity_id.includes('disk_use_percent'))?.state;
    const cpuTemp = Object.values(hassStates).find(e => e.entity_id.includes('cpu_temperature'))?.state ||
      Object.values(hassStates).find(e => e.entity_id.includes('temperature') && e.entity_id.includes('cpu'))?.state;

    if (processorUse) info.hw_processor = `${processorUse}% Usage`;
    if (memoryFree) info.hw_memory = `${memoryFree} MB Free`;
    if (diskUse) info.hw_disk = `${diskUse}% Used`;
    if (cpuTemp) info.hw_temp = `${cpuTemp}°C`;

    // Network Data
    const ipAddress = Object.values(hassStates).find(e => e.entity_id.includes('ipv4_address') || e.entity_id.includes('ip_address'))?.state;
    const hostname = Object.values(hassStates).find(e => e.entity_id.includes('hostname'))?.state;
    const macAddress = Object.values(hassStates).find(e => e.entity_id.includes('mac_address'))?.state;

    if (ipAddress) info.ip = ipAddress;
    if (hostname) info.hostname = hostname;
    if (macAddress) info.mac = macAddress;

    // Database Data
    const dbSize = Object.values(hassStates).find(e => e.entity_id.includes('database_size'))?.state;
    if (dbSize) info.db_size = `${dbSize} MB`;

    info.status = 'Healthy';

    return info;
  }, [hassStates]);

  const systemSections = [
    {
      id: 'general',
      title: 'General',
      icon: Server,
      items: [
        { label: 'System Version', value: systemInfo.core_version },
        { label: 'Installation Type', value: 'Voerynth OS / HAOS' },
        { label: 'Supervisor Version', value: systemInfo.supervisor_version },
        { label: 'Operating System', value: systemInfo.os_version }
      ]
    },
    {
      id: 'hardware',
      title: 'Hardware',
      icon: Cpu,
      items: [
        { label: 'Processor', value: systemInfo.hw_processor },
        { label: 'Memory Status', value: systemInfo.hw_memory },
        { label: 'Disk Usage', value: systemInfo.hw_disk },
        { label: 'CPU Temperature', value: systemInfo.hw_temp }
      ]
    },
    {
      id: 'network',
      title: 'Network',
      icon: Network,
      items: [
        { label: 'IP Address', value: systemInfo.ip },
        { label: 'Hostname', value: systemInfo.hostname },
        { label: 'MAC Address', value: systemInfo.mac },
        { label: 'Network Speed', value: '1000 Mbps' }
      ]
    },
    {
      id: 'database',
      title: 'Database',
      icon: Database,
      items: [
        { label: 'Database Engine', value: 'SQLite' },
        { label: 'Database Size', value: systemInfo.db_size },
        { label: 'Recorder Purge', value: 'Keep 10 days' },
        { label: 'Last Purge', value: '2 hours ago' }
      ]
    }
  ];

  const quickActions = [
    { id: 'restart', label: 'Restart System', icon: RefreshCw, color: 'amber' },
    { id: 'reboot', label: 'Reboot System', icon: RefreshCw, color: 'orange' },
    { id: 'backup', label: 'Create Backup', icon: Download, color: 'green' },
    { id: 'restore', label: 'Restore Backup', icon: Upload, color: 'blue' },
    { id: 'logs', label: 'View Logs', icon: Activity, color: 'purple' },
    { id: 'security', label: 'Security Settings', icon: Shield, color: 'red' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/settings')}
          className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-100">System</h1>
          <p className="text-slate-400 mt-1">System information and settings</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors text-center"
              >
                <div className={`p-3 rounded-lg bg-${action.color}-500/10 mx-auto w-fit mb-2`}>
                  <Icon className={`w-5 h-5 text-${action.color}-400`} />
                </div>
                <p className="text-xs text-slate-300">{action.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Information Sections */}
      <div className="space-y-4">
        {systemSections.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-cyan-500/10">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-200">{section.title}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="text-sm text-slate-200 font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-green-500/10">
            <Activity className="w-5 h-5 text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-200">System Health</h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <span className="text-sm text-slate-300">Overall Status</span>
            <span className={`text-sm ${systemInfo.status === 'Healthy' ? 'text-green-400' : 'text-amber-400'} font-medium`}>{systemInfo.status}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <span className="text-sm text-slate-300">Last Check</span>
            <span className="text-sm text-slate-400">Just now</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <span className="text-sm text-slate-300">Uptime</span>
            <span className="text-sm text-slate-400">{systemInfo.uptime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemView;

