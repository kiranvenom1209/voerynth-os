/**
 * Integrations Management View
 *
 * List, add, reconfigure, and manage Home Assistant integrations.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Settings, RefreshCw, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { useAccentColor } from '../context/AccentColorContext';
import { useHomeAssistant } from '../context/HomeAssistantContext';
import Card from '../components/Card';
import IntegrationFlowModal from '../components/settings/IntegrationFlowModal';
import haClient from '../services/haClient';

const IntegrationsView = () => {
  const { colors } = useAccentColor();
  const { connectionStatus, getHAConnection } = useHomeAssistant();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [flowContext, setFlowContext] = useState('user');
  const [selectedEntryId, setSelectedEntryId] = useState(null);

  // Set up HAClient with existing connection
  useEffect(() => {
    const haConnection = getHAConnection();
    if (haConnection && haConnection.connected) {
      console.log('🔌 IntegrationsView: Setting up HAClient with existing connection');
      haClient.setHAConnection(haConnection);
      loadIntegrations();
    }
  }, [connectionStatus, getHAConnection]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading integrations...');
      console.log('🔍 haClient connection status:', haClient.haConnection?.connected);

      const entries = await haClient.callWS('config/config_entries/list');
      console.log('✅ Loaded integrations:', entries?.length || 0);
      console.log('📦 Integration entries:', entries);

      setIntegrations(entries || []);
    } catch (error) {
      console.error('❌ Failed to load integrations:', error);
      console.error('❌ Error details:', error.message, error.stack);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = (domain) => {
    setSelectedDomain(domain);
    setFlowContext('user');
    setSelectedEntryId(null);
    setFlowModalOpen(true);
  };

  const handleReconfigure = (entry) => {
    setSelectedDomain(entry.domain);
    setFlowContext('reconfigure');
    setSelectedEntryId(entry.entry_id);
    setFlowModalOpen(true);
  };

  const handleReauth = (entry) => {
    setSelectedDomain(entry.domain);
    setFlowContext('reauth');
    setSelectedEntryId(entry.entry_id);
    setFlowModalOpen(true);
  };

  const handleFlowSuccess = () => {
    loadIntegrations();
  };

  const filteredIntegrations = integrations.filter(integration =>
    integration.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    integration.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Common integrations for quick add
  const commonIntegrations = [
    { domain: 'hue', name: 'Philips Hue', icon: '💡' },
    { domain: 'mqtt', name: 'MQTT', icon: '📡' },
    { domain: 'esphome', name: 'ESPHome', icon: '🔌' },
    { domain: 'matter', name: 'Matter', icon: '🏠' },
    { domain: 'zha', name: 'Zigbee (ZHA)', icon: '📶' },
    { domain: 'google_assistant', name: 'Google Assistant', icon: '🎙️' },
    { domain: 'alexa', name: 'Amazon Alexa', icon: '🗣️' },
    { domain: 'spotify', name: 'Spotify', icon: '🎵' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-slate-200">Integrations</h1>
          <p className={`text-sm ${colors.text} mt-1`}>Manage your Home Assistant integrations</p>
        </div>
        <button
          onClick={loadIntegrations}
          className={`p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors`}
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${colors.text}`} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search integrations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Quick Add */}
      <Card title="Quick Add" subtitle="Popular integrations">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {commonIntegrations.map((integration) => (
            <button
              key={integration.domain}
              onClick={() => handleAddIntegration(integration.domain)}
              className="flex flex-col items-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 rounded-lg transition-all group"
            >
              <span className="text-3xl">{integration.icon}</span>
              <span className="text-sm text-slate-300 group-hover:text-cyan-400 transition-colors text-center">
                {integration.name}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Installed Integrations */}
      <Card
        title="Installed Integrations"
        subtitle={`${filteredIntegrations.length} integration${filteredIntegrations.length !== 1 ? 's' : ''}`}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        ) : filteredIntegrations.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchQuery ? 'No integrations found' : 'No integrations installed'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.entry_id}
                integration={integration}
                onReconfigure={handleReconfigure}
                onReauth={handleReauth}
                colors={colors}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Flow Modal */}
      <IntegrationFlowModal
        isOpen={flowModalOpen}
        onClose={() => setFlowModalOpen(false)}
        domain={selectedDomain}
        context={flowContext}
        entryId={selectedEntryId}
        onSuccess={handleFlowSuccess}
      />
    </div>
  );
};

/**
 * Integration Card Component
 */
const IntegrationCard = ({ integration, onReconfigure, onReauth, colors }) => {
  const getStatusIcon = () => {
    if (integration.state === 'loaded') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    switch (integration.state) {
      case 'loaded':
        return 'Active';
      case 'setup_error':
        return 'Setup Error';
      case 'setup_retry':
        return 'Retrying';
      case 'not_loaded':
        return 'Not Loaded';
      case 'failed_unload':
        return 'Failed to Unload';
      default:
        return integration.state;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="text-slate-200 font-medium">{integration.title}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-500">{integration.domain}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${
              integration.state === 'loaded'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}>
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {integration.supports_reconfigure && (
          <button
            onClick={() => onReconfigure(integration)}
            className={`p-2 hover:bg-slate-700 rounded-lg transition-colors group`}
            title="Reconfigure"
          >
            <Settings className={`w-5 h-5 text-slate-400 group-hover:${colors.text}`} />
          </button>
        )}
        {integration.state === 'setup_error' && (
          <button
            onClick={() => onReauth(integration)}
            className={`px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors text-sm`}
            title="Reauthenticate"
          >
            Reauth
          </button>
        )}
      </div>
    </div>
  );
};

export default IntegrationsView;
