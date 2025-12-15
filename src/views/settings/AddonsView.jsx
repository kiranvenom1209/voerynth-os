import React, { useMemo } from 'react';
import { ArrowLeft, Plus, Puzzle, Play, Square, RotateCw, Settings, ExternalLink, AlertCircle } from 'lucide-react';
import { useSettingsNav } from '../SettingsView';
import { useAccentColor } from '../../context/AccentColorContext';

/**
 * Add-ons View
 * Manage Home Assistant add-ons (Supervisor only)
 */
const AddonsView = () => {
  const { navigate } = useSettingsNav();
  const { colors } = useAccentColor();

  // Check if running on Home Assistant OS/Supervised (has Supervisor)
  const hasSupervisor = true;

  // Mock add-ons data (in real implementation, fetch from Supervisor API)
  const addons = [
    {
      slug: 'core_mosquitto',
      name: 'Mosquitto broker',
      description: 'An Open Source MQTT broker',
      version: '6.4.0',
      state: 'started',
      icon: 'mosquitto',
      installed: true
    },
    {
      slug: 'a0d7b954_vscode',
      name: 'Studio Code Server',
      description: 'Fully featured VSCode experience',
      version: '5.15.0',
      state: 'started',
      icon: 'vscode',
      installed: true
    },
    {
      slug: 'core_mariadb',
      name: 'MariaDB',
      description: 'MariaDB database for Home Assistant',
      version: '2.7.1',
      state: 'stopped',
      icon: 'mariadb',
      installed: true
    }
  ];

  const installedAddons = addons.filter(a => a.installed);
  const availableAddons = addons.filter(a => !a.installed);

  if (!hasSupervisor) {
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
            <h1 className="text-3xl font-bold text-slate-100">Add-ons</h1>
            <p className="text-slate-400 mt-1">Extend Home Assistant functionality</p>
          </div>
        </div>

        {/* Not Available Message */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Add-ons Not Available</h3>
          <p className="text-slate-500 mb-4 max-w-md mx-auto">
            Add-ons are only available on supervised installations with the Supervisor component.
          </p>
          <p className="text-sm text-slate-600">
            You appear to be running a container or core installation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Add-ons</h1>
            <p className="text-slate-400 mt-1">{installedAddons.length} add-ons installed</p>
          </div>
        </div>
        <button
          className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
        >
          <Plus className="w-4 h-4" />
          Add-on Store
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button className="px-4 py-2 text-sm font-medium border-b-2 transition-colors" style={{ borderColor: colors.accent, color: colors.accent }}>
          Installed
        </button>
        <button className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 border-b-2 border-transparent transition-colors">
          Add-on Store
        </button>
        <button className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-300 border-b-2 border-transparent transition-colors">
          Repositories
        </button>
      </div>

      {/* Installed Add-ons */}
      <div className="space-y-3">
        {installedAddons.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
            <Puzzle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No add-ons installed</h3>
            <p className="text-slate-500 mb-6">Browse the add-on store to extend Home Assistant</p>
            <button
              className="px-6 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Browse Add-on Store
            </button>
          </div>
        ) : (
          installedAddons.map(addon => {
            const isRunning = addon.state === 'started';
            
            return (
              <div
                key={addon.slug}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${isRunning ? 'bg-green-500/10' : 'bg-slate-700/50'}`}>
                      <Puzzle className={`w-6 h-6 ${isRunning ? 'text-green-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-slate-100 font-medium">{addon.name}</h3>
                      <p className="text-sm text-slate-400 mt-1">{addon.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span>Version {addon.version}</span>
                        <span>•</span>
                        <span className={isRunning ? 'text-green-400' : 'text-slate-500'}>
                          {isRunning ? 'Running' : 'Stopped'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Open Web UI">
                      <ExternalLink className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Restart">
                      <RotateCw className="w-4 h-4 text-slate-400" />
                    </button>
                    <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Configuration">
                      <Settings className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title={isRunning ? 'Stop' : 'Start'}
                    >
                      {isRunning ? (
                        <Square className="w-4 h-4 text-slate-400" />
                      ) : (
                        <Play className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AddonsView;

