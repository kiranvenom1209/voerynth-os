import React, { useMemo } from 'react';
import { ArrowLeft, Plus, Zap, Play, Pause, Edit, Trash2, Copy, Sun, Moon, Clock } from 'lucide-react';
import { useSettingsNav } from '../SettingsView';
import { useAccentColor } from '../../context/AccentColorContext';
import { useHomeAssistant } from '../../context/HomeAssistantContext';
import useHAStore from '../../stores/haStore';

/**
 * Automations & Scenes View
 * Shows all automations and scenes with ability to trigger/edit
 */
const AutomationsView = () => {
  const { navigate } = useSettingsNav();
  const { colors } = useAccentColor();
  const { callService } = useHomeAssistant();
  const { statesByEntityId } = useHAStore();
  const [activeTab, setActiveTab] = React.useState('automations');

  // Get all automations and scenes from states
  const automations = useMemo(() => {
    if (!statesByEntityId) return [];
    return Object.values(statesByEntityId)
      .filter(entity => entity.entity_id.startsWith('automation.'))
      .sort((a, b) => (a.attributes?.friendly_name || a.entity_id).localeCompare(b.attributes?.friendly_name || b.entity_id));
  }, [statesByEntityId]);

  const scenes = useMemo(() => {
    if (!statesByEntityId) return [];
    return Object.values(statesByEntityId)
      .filter(entity => entity.entity_id.startsWith('scene.'))
      .sort((a, b) => (a.attributes?.friendly_name || a.entity_id).localeCompare(b.attributes?.friendly_name || b.entity_id));
  }, [statesByEntityId]);

  const scripts = useMemo(() => {
    if (!statesByEntityId) return [];
    return Object.values(statesByEntityId)
      .filter(entity => entity.entity_id.startsWith('script.'))
      .sort((a, b) => (a.attributes?.friendly_name || a.entity_id).localeCompare(b.attributes?.friendly_name || b.entity_id));
  }, [statesByEntityId]);

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 AutomationsView - statesByEntityId:', statesByEntityId);
    console.log('🔍 AutomationsView - Total entities:', Object.keys(statesByEntityId || {}).length);
    console.log('🔍 AutomationsView - Automations found:', automations.length);
    console.log('🔍 AutomationsView - Scenes found:', scenes.length);
    console.log('🔍 AutomationsView - Scripts found:', scripts.length);

    // Log all entity IDs that start with automation, scene, or script
    const allEntityIds = Object.keys(statesByEntityId || {});
    const automationIds = allEntityIds.filter(id => id.startsWith('automation.'));
    const sceneIds = allEntityIds.filter(id => id.startsWith('scene.'));
    const scriptIds = allEntityIds.filter(id => id.startsWith('script.'));

    console.log('🔍 Automation IDs:', automationIds);
    console.log('🔍 Scene IDs:', sceneIds);
    console.log('🔍 Script IDs:', scriptIds);
  }, [statesByEntityId, automations, scenes, scripts]);

  // Handler functions
  const handleToggleAutomation = async (entityId, currentState) => {
    try {
      const service = currentState === 'on' ? 'turn_off' : 'turn_on';
      await callService('automation', service, { entity_id: entityId });
    } catch (error) {
      console.error('Failed to toggle automation:', error);
      alert('Failed to toggle automation. Check console for details.');
    }
  };

  const handleTriggerAutomation = async (entityId) => {
    try {
      await callService('automation', 'trigger', { entity_id: entityId });
      alert('Automation triggered successfully!');
    } catch (error) {
      console.error('Failed to trigger automation:', error);
      alert('Failed to trigger automation. Check console for details.');
    }
  };

  const handleEditAutomation = (entityId) => {
    // Open Home Assistant automation editor in new tab
    const haUrl = localStorage.getItem('ha_url') || 'http://localhost:8123';
    const automationId = entityId.replace('automation.', '');
    window.open(`${haUrl}/config/automation/edit/${automationId}`, '_blank');
  };

  const handleDuplicateAutomation = async (entityId) => {
    try {
      // Get the automation config
      const state = statesByEntityId[entityId];
      if (!state) {
        alert('Automation not found');
        return;
      }

      // In a real implementation, this would duplicate the automation
      // For now, just show what would be duplicated
      console.log('Duplicating automation:', state);
      alert(`Duplicate automation: ${state.attributes?.friendly_name || entityId}\n\nThis feature requires additional Home Assistant API calls to duplicate automations.`);
    } catch (error) {
      console.error('Failed to duplicate automation:', error);
      alert('Failed to duplicate automation. Check console for details.');
    }
  };

  const handleDeleteAutomation = async (entityId) => {
    const state = statesByEntityId[entityId];
    const name = state?.attributes?.friendly_name || entityId;

    if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      // Note: Deleting automations requires file system access or specific HA API
      // Most automations are stored in automations.yaml
      console.log('Delete automation requested:', entityId);
      alert(`Delete automation: ${name}\n\nDeleting automations requires direct file system access or Home Assistant configuration API.\n\nPlease delete this automation from the Home Assistant UI.`);
    } catch (error) {
      console.error('Failed to delete automation:', error);
      alert('Failed to delete automation. Check console for details.');
    }
  };

  const handleCreateAutomation = () => {
    // Open Home Assistant automation creation page
    const haUrl = localStorage.getItem('ha_url') || 'http://localhost:8123';
    window.open(`${haUrl}/config/automation/new`, '_blank');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 sm:p-2 hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold text-slate-100 truncate">Automations & Scenes</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 truncate">
              {automations.length} automations • {scenes.length} scenes • {scripts.length} scripts
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateAutomation}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors flex items-center gap-1.5 sm:gap-2 flex-shrink-0 text-sm sm:text-base"
          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Create Automation</span>
          <span className="sm:hidden">Create</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 -mx-3 sm:mx-0">
        <div className="flex gap-0.5 sm:gap-2 px-3 sm:px-0 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('automations')}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0"
            style={activeTab === 'automations' ? { borderColor: colors.accent, color: colors.accent } : { borderColor: 'transparent', color: '#94a3b8' }}
          >
            Automations ({automations.length})
          </button>
          <button
            onClick={() => setActiveTab('scenes')}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors hover:text-slate-300 whitespace-nowrap flex-shrink-0"
            style={activeTab === 'scenes' ? { borderColor: colors.accent, color: colors.accent } : { borderColor: 'transparent', color: '#94a3b8' }}
          >
            Scenes ({scenes.length})
          </button>
          <button
            onClick={() => setActiveTab('scripts')}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors hover:text-slate-300 whitespace-nowrap flex-shrink-0"
            style={activeTab === 'scripts' ? { borderColor: colors.accent, color: colors.accent } : { borderColor: 'transparent', color: '#94a3b8' }}
          >
            Scripts ({scripts.length})
          </button>
        </div>
      </div>

      {/* Automations List */}
      {activeTab === 'automations' && (
        <div className="space-y-3">
        {automations.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
            <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No automations found</h3>
            <p className="text-slate-500 mb-6">Create your first automation to get started</p>
            <button
              onClick={handleCreateAutomation}
              className="px-6 py-2 rounded-lg transition-colors"
              style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Create Automation
            </button>
          </div>
        ) : (
          automations.map(automation => (
            <div
              key={automation.entity_id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 sm:p-4 hover:border-slate-600 transition-colors overflow-hidden"
            >
              <div className="flex items-center justify-between gap-1.5 sm:gap-4">
                <div className="flex items-center gap-1.5 sm:gap-4 flex-1 min-w-0 overflow-hidden">
                  <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${automation.state === 'on' ? 'bg-green-500/10' : 'bg-slate-700/50'}`}>
                    <Zap className={`w-4 h-4 sm:w-5 sm:h-5 ${automation.state === 'on' ? 'text-green-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h3 className="text-xs sm:text-base text-slate-100 font-medium truncate">
                      {automation.attributes.friendly_name || automation.entity_id}
                    </h3>
                    <p className="text-[10px] sm:text-sm text-slate-500 truncate">
                      {automation.state === 'on' ? 'Enabled' : 'Disabled'}
                      {automation.attributes.last_triggered && (
                        <span className="hidden sm:inline"> • Last triggered: {new Date(automation.attributes.last_triggered).toLocaleString()}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEditAutomation(automation.entity_id)}
                    className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors hidden sm:block"
                    title="Edit"
                  >
                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleDuplicateAutomation(automation.entity_id)}
                    className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors hidden sm:block"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteAutomation(automation.entity_id)}
                    className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors hidden sm:block"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleToggleAutomation(automation.entity_id, automation.state)}
                    className="p-1 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    title={automation.state === 'on' ? 'Disable' : 'Enable'}
                  >
                    {automation.state === 'on' ? (
                      <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      )}

      {/* Scenes List */}
      {activeTab === 'scenes' && (
        <div className="space-y-3">
          {scenes.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
              <Sun className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No scenes found</h3>
              <p className="text-slate-500 mb-6">Create your first scene to get started</p>
              <button
                onClick={() => {
                  const haUrl = localStorage.getItem('ha_url') || 'http://localhost:8123';
                  window.open(`${haUrl}/config/scene/new`, '_blank');
                }}
                className="px-6 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create Scene
              </button>
            </div>
          ) : (
            scenes.map(scene => (
              <div
                key={scene.entity_id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-2 sm:p-4 hover:border-slate-600 transition-colors overflow-hidden"
              >
                <div className="flex items-center justify-between gap-1.5 sm:gap-4">
                  <div className="flex items-center gap-1.5 sm:gap-4 flex-1 min-w-0 overflow-hidden">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 flex-shrink-0">
                      <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="text-xs sm:text-base text-slate-100 font-medium truncate">
                        {scene.attributes?.friendly_name || scene.entity_id}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] sm:text-sm text-slate-500 overflow-hidden">
                        <span className="flex-shrink-0">Scene</span>
                        <span className="flex-shrink-0">•</span>
                        <span className="truncate font-mono">{scene.entity_id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        const haUrl = localStorage.getItem('ha_url') || 'http://localhost:8123';
                        const sceneId = scene.entity_id.replace('scene.', '');
                        window.open(`${haUrl}/config/scene/edit/${sceneId}`, '_blank');
                      }}
                      className="p-1 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await callService('scene', 'turn_on', { entity_id: scene.entity_id });
                          alert(`Scene "${scene.attributes?.friendly_name || scene.entity_id}" activated!`);
                        } catch (error) {
                          console.error('Failed to activate scene:', error);
                          alert('Failed to activate scene. Check console for details.');
                        }
                      }}
                      className="px-1.5 sm:px-3 py-1 sm:py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors text-[10px] sm:text-sm whitespace-nowrap"
                      title="Activate Scene"
                    >
                      <span className="hidden sm:inline">Activate</span>
                      <span className="sm:hidden">Act</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Scripts List */}
      {activeTab === 'scripts' && (
        <div className="space-y-3">
          {scripts.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-300 mb-2">No scripts found</h3>
              <p className="text-slate-500 mb-6">Create your first script to get started</p>
              <button
                onClick={() => {
                  const haUrl = localStorage.getItem('ha_url') || 'http://localhost:8123';
                  window.open(`${haUrl}/config/script/new`, '_blank');
                }}
                className="px-6 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create Script
              </button>
            </div>
          ) : (
            scripts.map(script => {
              const isRunning = script.state === 'on';

              return (
                <div
                  key={script.entity_id}
                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-lg ${isRunning ? 'bg-cyan-500/10' : 'bg-slate-700/50'}`}>
                        <Clock className={`w-5 h-5 ${isRunning ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-slate-100 font-medium">
                          {script.attributes?.friendly_name || script.entity_id}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {isRunning ? 'Running...' : 'Ready'} • {script.entity_id}
                          {script.attributes?.last_triggered && ` • Last run: ${new Date(script.attributes.last_triggered).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const haUrl = localStorage.getItem('ha_url') || 'http://localhost:8123';
                          const scriptId = script.entity_id.replace('script.', '');
                          window.open(`${haUrl}/config/script/edit/${scriptId}`, '_blank');
                        }}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await callService('script', 'turn_on', { entity_id: script.entity_id });
                            alert(`Script "${script.attributes?.friendly_name || script.entity_id}" started!`);
                          } catch (error) {
                            console.error('Failed to run script:', error);
                            alert('Failed to run script. Check console for details.');
                          }
                        }}
                        disabled={isRunning}
                        className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Run Script"
                      >
                        {isRunning ? 'Running...' : 'Run'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default AutomationsView;

