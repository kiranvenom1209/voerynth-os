import React, { useMemo, useState } from 'react';
import { ArrowLeft, Edit, Trash2, MapPin, Smartphone, Activity, Eye, EyeOff, Power, AlertCircle, ChevronRight } from 'lucide-react';
import { useSettingsNav } from '../SettingsView';
import { useAccentColor } from '../../context/AccentColorContext';
import useHAStore from '../../stores/haStore';
import EntityEditModal from '../../components/EntityEditModal';

/**
 * Entity Detail View
 * Shows detailed information about a specific entity
 */
const EntityDetailView = ({ entityId }) => {
  const { navigate } = useSettingsNav();
  const { colors } = useAccentColor();
  const { entityRegistry, entityRegByEntityId, statesByEntityId, devicesById, areasById } = useHAStore();
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Get the entity registry entry
  const entity = useMemo(() => {
    return entityRegByEntityId[entityId];
  }, [entityRegByEntityId, entityId]);

  // Get the entity state
  const state = useMemo(() => {
    return statesByEntityId[entityId];
  }, [statesByEntityId, entityId]);

  // Get device
  const device = useMemo(() => {
    if (!entity?.device_id) return null;
    return devicesById[entity.device_id];
  }, [entity, devicesById]);

  // Get area
  const area = useMemo(() => {
    // Entity can have area directly or inherit from device
    const areaId = entity?.area_id || device?.area_id;
    if (!areaId) return null;
    return areasById[areaId];
  }, [entity, device, areasById]);

  if (!entity) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings/devices-services')}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Entity Not Found</h1>
          </div>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Entity not found</h3>
          <p className="text-slate-500">The entity you're looking for doesn't exist</p>
        </div>
      </div>
    );
  }

  const friendlyName = entity.name || state?.attributes?.friendly_name || entityId;
  const currentValue = state?.state ?? 'unavailable';
  const domain = entityId.split('.')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings/devices-services')}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">{friendlyName}</h1>
            <p className="text-slate-400 mt-1 font-mono text-sm">{entityId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Delete Entity"
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Current State Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          Current State
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">State</p>
            <p className={`text-3xl font-bold ${
              currentValue === 'unavailable' ? 'text-red-400' :
              currentValue === 'unknown' ? 'text-slate-500' :
              currentValue === 'on' ? 'text-green-400' :
              currentValue === 'off' ? 'text-slate-400' :
              'text-cyan-400'
            }`}>
              {currentValue}
              {state?.attributes?.unit_of_measurement && (
                <span className="text-lg ml-2 text-slate-400">{state.attributes.unit_of_measurement}</span>
              )}
            </p>
          </div>
          {state?.last_changed && (
            <div className="text-right">
              <p className="text-sm text-slate-500 mb-1">Last Changed</p>
              <p className="text-sm text-slate-300">
                {new Date(state.last_changed).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Entity Information Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Entity Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">Name</p>
              <p className="text-slate-200">{friendlyName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Entity ID</p>
              <p className="text-slate-200 font-mono text-sm">{entityId}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Domain</p>
              <p className="text-slate-200 capitalize">{domain}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Platform</p>
              <p className="text-slate-200">{entity.platform || 'Unknown'}</p>
            </div>
            {entity.icon && (
              <div>
                <p className="text-sm text-slate-500">Icon</p>
                <p className="text-slate-200">{entity.icon}</p>
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-500">Area</p>
              <div className="flex items-center gap-2">
                {area ? (
                  <>
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <p className="text-slate-200">{area.name}</p>
                  </>
                ) : (
                  <p className="text-slate-500">Not assigned</p>
                )}
              </div>
            </div>
            {device && (
              <div>
                <p className="text-sm text-slate-500">Device</p>
                <button
                  onClick={() => navigate(`/settings/devices-services/device/${device.id}`)}
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>{device.name_by_user || device.name}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <div className="flex items-center gap-2">
                {entity.disabled_by ? (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded flex items-center gap-1">
                    <Power className="w-3 h-3" />
                    Disabled by {entity.disabled_by}
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                    Enabled
                  </span>
                )}
                {entity.hidden_by && (
                  <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs rounded flex items-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    Hidden by {entity.hidden_by}
                  </span>
                )}
              </div>
            </div>
            {entity.unique_id && (
              <div>
                <p className="text-sm text-slate-500">Unique ID</p>
                <p className="text-slate-400 font-mono text-xs break-all">{entity.unique_id}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attributes Card */}
      {state?.attributes && Object.keys(state.attributes).length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Attributes</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(state.attributes).map(([key, value]) => (
              <div key={key} className="flex items-start justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-sm text-slate-400 font-mono">{key}</span>
                <span className="text-sm text-slate-200 text-right ml-4 break-all max-w-md">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History Card */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">History</h2>
        <div className="space-y-3">
          {state?.last_changed && (
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <span className="text-sm text-slate-400">Last Changed</span>
              <span className="text-sm text-slate-200">
                {new Date(state.last_changed).toLocaleString()}
              </span>
            </div>
          )}
          {state?.last_updated && (
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <span className="text-sm text-slate-400">Last Updated</span>
              <span className="text-sm text-slate-200">
                {new Date(state.last_updated).toLocaleString()}
              </span>
            </div>
          )}
          {state?.context?.id && (
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <span className="text-sm text-slate-400">Context ID</span>
              <span className="text-sm text-slate-400 font-mono text-xs">{state.context.id}</span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EntityEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        entity={entity}
      />
    </div>
  );
};

export default EntityDetailView;

