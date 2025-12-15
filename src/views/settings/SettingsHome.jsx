import React from 'react';
import {
  Smartphone,
  Cog,
  MapPin,
  Zap,
  Users,
  Puzzle,
  Calendar,
  Bell,
  Palette,
  Shield,
  Database,
  Cloud,
  ChevronRight
} from 'lucide-react';
import { useAccentColor } from '../../context/AccentColorContext';
import { useSettingsNav } from '../SettingsView';

/**
 * Settings Home Page
 * Main settings landing page with tiles matching HA UX
 */
const SettingsHome = () => {
  const { colors } = useAccentColor();
  const { navigate } = useSettingsNav();

  const settingsSections = [
    {
      id: 'devices-services',
      title: 'Devices & Services',
      description: 'Manage integrations, devices, entities, and helpers',
      icon: Smartphone,
      path: '/settings/devices-services',
      color: 'cyan'
    },
    {
      id: 'automations',
      title: 'Automations & Scenes',
      description: 'Create and manage automations and scenes',
      icon: Zap,
      path: '/settings/automations',
      color: 'amber'
    },
    {
      id: 'areas',
      title: 'Areas',
      description: 'Organize your home into areas',
      icon: MapPin,
      path: '/settings/areas',
      color: 'green'
    },
    {
      id: 'people',
      title: 'People',
      description: 'Manage people and presence detection',
      icon: Users,
      path: '/settings/people',
      color: 'purple'
    },
    {
      id: 'addons',
      title: 'Add-ons',
      description: 'Install and manage add-ons',
      icon: Puzzle,
      path: '/settings/addons',
      color: 'blue'
    },
    {
      id: 'system',
      title: 'System',
      description: 'System settings and information',
      icon: Cog,
      path: '/settings/system',
      color: 'slate'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Settings</h1>
        <p className="text-slate-400">Configure and manage your Voerynth OS</p>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => navigate(section.path)}
              className="group bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-cyan-500/50 transition-all text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg bg-${section.color}-500/10 group-hover:bg-${section.color}-500/20 transition-colors`}>
                  <Icon className={`w-6 h-6 text-${section.color}-400`} />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              
              <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-cyan-400 transition-colors">
                {section.title}
              </h3>
              <p className="text-sm text-slate-400">
                {section.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SettingsHome;

