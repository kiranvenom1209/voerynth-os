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
    if (!hassStates) return {};
    
    const info = {};
    Object.values(hassStates).forEach(entity => {
      if (entity.entity_id.includes('system_monitor') || entity.entity_id.includes('version')) {
        info[entity.entity_id] = entity;
      }
    });
    return info;
  }, [hassStates]);

  const systemSections = [
    {
      id: 'general',
      title: 'General',
      icon: Server,
      items: [
        { label: 'System Version', value: '2024.12.0' },
        { label: 'Installation Type', value: 'Voerynth OS' },
        { label: 'Supervisor Version', value: '2024.11.4' },
        { label: 'Operating System', value: 'Voerynth OS 11.2' }
      ]
    },
    {
      id: 'hardware',
      title: 'Hardware',
      icon: Cpu,
      items: [
        { label: 'Processor', value: 'Intel Core i5' },
        { label: 'Memory Usage', value: '2.4 GB / 8.0 GB (30%)' },
        { label: 'Disk Usage', value: '45.2 GB / 128 GB (35%)' },
        { label: 'CPU Temperature', value: '45°C' }
      ]
    },
    {
      id: 'network',
      title: 'Network',
      icon: Network,
      items: [
        { label: 'IP Address', value: '192.168.1.100' },
        { label: 'Hostname', value: 'voerynth.local' },
        { label: 'MAC Address', value: '00:1A:2B:3C:4D:5E' },
        { label: 'Network Speed', value: '1000 Mbps' }
      ]
    },
    {
      id: 'database',
      title: 'Database',
      icon: Database,
      items: [
        { label: 'Database Engine', value: 'SQLite' },
        { label: 'Database Size', value: '1.2 GB' },
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
            <span className="text-sm text-green-400 font-medium">Healthy</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <span className="text-sm text-slate-300">Last Check</span>
            <span className="text-sm text-slate-400">2 minutes ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <span className="text-sm text-slate-300">Uptime</span>
            <span className="text-sm text-slate-400">7 days, 14 hours</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemView;

