import React, { useState } from 'react';
import { ArrowLeft, Puzzle, Smartphone, List, Wrench } from 'lucide-react';
import { useAccentColor } from '../../context/AccentColorContext';
import { useSettingsNav } from '../SettingsView';
import IntegrationsTab from './tabs/IntegrationsTab';
import DevicesTab from './tabs/DevicesTab';
import EntitiesTab from './tabs/EntitiesTab';
import HelpersTab from './tabs/HelpersTab';

/**
 * Devices & Services View
 * Main page with tabs: Integrations, Devices, Entities, Helpers
 */
const DevicesServicesView = () => {
  const { colors } = useAccentColor();
  const { navigate } = useSettingsNav();
  const [activeTab, setActiveTab] = useState('integrations');

  const tabs = [
    { id: 'integrations', label: 'Integrations', icon: Puzzle },
    { id: 'devices', label: 'Devices', icon: Smartphone },
    { id: 'entities', label: 'Entities', icon: List },
    { id: 'helpers', label: 'Helpers', icon: Wrench }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => navigate('/settings')}
          className="p-1.5 sm:p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-100 truncate">Devices & Services</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 truncate">Manage integrations, devices, and entities</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 -mx-3 sm:mx-0">
        <div className="flex gap-0.5 sm:gap-1 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? `border-${colors.name}-500 ${colors.text} bg-slate-800/30`
                    : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/20'
                }`}
              >
                <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium text-xs sm:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'integrations' && <IntegrationsTab />}
        {activeTab === 'devices' && <DevicesTab />}
        {activeTab === 'entities' && <EntitiesTab />}
        {activeTab === 'helpers' && <HelpersTab />}
      </div>
    </div>
  );
};

export default DevicesServicesView;

