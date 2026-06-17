import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  Clock,
  Edit,
  EyeOff,
  Info,
  Lock,
  MapPin,
  Play,
  Power,
  RotateCw,
  Smartphone,
  Square,
  Trash2,
  Unlock,
  Volume2,
  Zap
} from 'lucide-react';
import { useSettingsNav } from '../SettingsView';
import { useAccentColor } from '../../context/AccentColorContext';
import { useHomeAssistant } from '../../context/HomeAssistantContext';
import useHAStore from '../../stores/haStore';
import EntityEditModal from '../../components/EntityEditModal';

const TOGGLEABLE_DOMAINS = new Set([
  'automation',
  'fan',
  'input_boolean',
  'light',
  'remote',
  'siren',
  'switch'
]);

const formatDate = (value) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
};

const formatAttributeValue = (value) => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const getFriendlyName = (entityId, registryEntity, state) =>
  registryEntity?.name ||
  registryEntity?.original_name ||
  state?.attributes?.friendly_name ||
  entityId;

const getStateClass = (stateValue) => {
  switch (stateValue) {
    case 'on':
    case 'open':
    case 'unlocked':
    case 'playing':
    case 'home':
      return 'text-green-400';
    case 'off':
    case 'closed':
    case 'locked':
    case 'idle':
    case 'standby':
      return 'text-slate-300';
    case 'unavailable':
      return 'text-red-400';
    case 'unknown':
      return 'text-slate-500';
    default:
      return 'text-cyan-400';
  }
};

const isEntityActionable = (domain) =>
  TOGGLEABLE_DOMAINS.has(domain) ||
  ['button', 'cover', 'input_button', 'lock', 'media_player', 'scene', 'script'].includes(domain);

const EntityDetailView = ({ entityId }) => {
  const { navigate } = useSettingsNav();
  const { colors } = useAccentColor();
  const { callService, hassStates } = useHomeAssistant();
  const {
    areasById,
    configEntriesById,
    devicesById,
    entityRegByEntityId,
    removeEntity,
    statesByEntityId
  } = useHAStore();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [actionError, setActionError] = useState('');

  const domain = entityId.includes('.') ? entityId.split('.')[0] : 'entity';
  const registryEntity = entityRegByEntityId[entityId];
  const state = statesByEntityId[entityId] || hassStates?.[entityId];

  const entity = useMemo(() => {
    if (registryEntity) return registryEntity;
    if (!state) return null;

    return {
      entity_id: entityId,
      name: state.attributes?.friendly_name || entityId,
      platform: domain,
      state_only: true
    };
  }, [domain, entityId, registryEntity, state]);

  const device = entity?.device_id ? devicesById[entity.device_id] : null;
  const areaId = entity?.area_id || device?.area_id;
  const area = areaId ? areasById[areaId] : null;
  const configEntry = entity?.config_entry_id ? configEntriesById[entity.config_entry_id] : null;
  const friendlyName = getFriendlyName(entityId, registryEntity, state);
  const currentValue = state?.state ?? 'unavailable';
  const unit = state?.attributes?.unit_of_measurement;
  const canEditRegistry = Boolean(registryEntity);
  const hasAttributes = Boolean(state?.attributes && Object.keys(state.attributes).length > 0);

  const runService = async (serviceDomain, service, data = {}) => {
    const actionKey = `${serviceDomain}.${service}`;
    setBusyAction(actionKey);
    setActionError('');

    try {
      await callService(serviceDomain, service, {
        entity_id: entityId,
        ...data
      });
    } catch (err) {
      setActionError(err.message || `Failed to call ${serviceDomain}.${service}`);
    } finally {
      setBusyAction('');
    }
  };

  const handleDeleteEntity = async () => {
    if (!canEditRegistry) {
      setActionError('Only registry-backed entities can be removed from this page.');
      return;
    }

    setBusyAction('entity.remove');
    setActionError('');

    try {
      await removeEntity(entityId);
      navigate('/settings/devices-services');
    } catch (err) {
      setActionError(err.message || 'Failed to remove entity.');
    } finally {
      setBusyAction('');
      setDeleteConfirmOpen(false);
    }
  };

  if (!entity) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/settings/devices-services')}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Entity Not Found</h1>
            <p className="text-slate-400 mt-1 font-mono text-sm">{entityId}</p>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Entity not found</h3>
          <p className="text-slate-500 mb-6">No live state or registry entry exists for this entity.</p>
          <button
            onClick={() => navigate('/settings/devices-services')}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
          >
            Back to Devices & Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <button
            onClick={() => navigate('/settings/devices-services')}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500 mb-1">
              <Info className="w-3 h-3" />
              More Info
            </div>
            <h1 className="text-3xl font-bold text-slate-100 break-words">{friendlyName}</h1>
            <p className="text-slate-400 mt-1 font-mono text-sm break-all">{entityId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end lg:self-auto">
          <button
            onClick={() => setEditModalOpen(true)}
            disabled={!canEditRegistry}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
            title={canEditRegistry ? 'Edit entity' : 'State-only entities cannot be edited here'}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={!canEditRegistry || busyAction === 'entity.remove'}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={canEditRegistry ? 'Remove entity' : 'State-only entities cannot be removed here'}
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {actionError && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {entity.state_only && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>This entity has live state, but no entity registry entry. Editing and removal are unavailable.</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-100 mb-1 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Current State
                </h2>
                <p className="text-sm text-slate-500">Live value from Home Assistant</p>
              </div>
              <span className="px-2 py-1 rounded bg-slate-900/70 text-xs text-slate-400 capitalize">
                {domain}
              </span>
            </div>

            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className={`text-4xl font-bold break-all ${getStateClass(currentValue)}`}>
                  {currentValue}
                  {unit && <span className="text-lg ml-2 text-slate-400">{unit}</span>}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-slate-500 mb-1">Last Changed</p>
                <p className="text-sm text-slate-300">{formatDate(state?.last_changed)}</p>
              </div>
            </div>
          </section>

          <EntityControls
            busyAction={busyAction}
            colors={colors}
            currentValue={currentValue}
            domain={domain}
            runService={runService}
            state={state}
          />

          {hasAttributes && (
            <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4">Attributes</h2>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {Object.entries(state.attributes).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-slate-400 font-mono break-all">{key}</span>
                    <pre className="text-sm text-slate-200 whitespace-pre-wrap break-all font-sans md:text-right">
                      {formatAttributeValue(value)}
                    </pre>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Details</h2>
            <InfoRow label="Entity ID" value={entityId} mono />
            <InfoRow label="Domain" value={domain} />
            <InfoRow label="Platform" value={entity.platform || configEntry?.domain || 'Unknown'} />
            {configEntry && (
              <InfoRow label="Integration" value={configEntry.title || configEntry.domain || 'Unknown'} />
            )}
            {entity.unique_id && <InfoRow label="Unique ID" value={entity.unique_id} mono />}
            {entity.original_name && <InfoRow label="Original Name" value={entity.original_name} />}
            {entity.icon && <InfoRow label="Icon" value={entity.icon} mono />}
          </section>

          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Location</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-2">Area</p>
                {area ? (
                  <div className="flex items-center gap-2 text-slate-200">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    <span>{area.name}</span>
                  </div>
                ) : (
                  <p className="text-slate-500">Not assigned</p>
                )}
              </div>

              <div>
                <p className="text-sm text-slate-500 mb-2">Device</p>
                {device ? (
                  <button
                    onClick={() => navigate(`/settings/devices-services/device/${device.id}`)}
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-left"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>{device.name_by_user || device.name || 'Unnamed Device'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                ) : (
                  <p className="text-slate-500">No device linked</p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Status</h2>
            <div className="space-y-3">
              {entity.disabled_by ? (
                <StatusPill tone="red" icon={<Power className="w-3 h-3" />}>
                  Disabled by {entity.disabled_by}
                </StatusPill>
              ) : (
                <StatusPill tone="green">Enabled</StatusPill>
              )}
              {entity.hidden_by && (
                <StatusPill tone="slate" icon={<EyeOff className="w-3 h-3" />}>
                  Hidden by {entity.hidden_by}
                </StatusPill>
              )}
            </div>
          </section>

          <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Timestamps
            </h2>
            <InfoRow label="Last Changed" value={formatDate(state?.last_changed)} />
            <InfoRow label="Last Updated" value={formatDate(state?.last_updated)} />
            {state?.context?.id && <InfoRow label="Context ID" value={state.context.id} mono />}
          </section>
        </aside>
      </div>

      <EntityEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        entity={registryEntity}
        onSaved={({ nextEntityId }) => {
          if (nextEntityId && nextEntityId !== entityId) {
            navigate(`/settings/devices-services/entity/${encodeURIComponent(nextEntityId)}`);
          }
        }}
      />

      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-slate-100 mb-3">Remove Entity?</h3>
            <p className="text-slate-400 mb-6">
              Remove <span className="text-slate-200 font-medium">{friendlyName}</span> from the entity registry?
              This may affect automations and dashboards that reference it.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEntity}
                disabled={busyAction === 'entity.remove'}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {busyAction === 'entity.remove' ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EntityControls = ({ busyAction, colors, currentValue, domain, runService, state }) => {
  const attrs = state?.attributes || {};
  const canRenderPrimary = isEntityActionable(domain);

  const renderPrimaryAction = () => {
    if (!canRenderPrimary) return null;

    if (domain === 'button' || domain === 'input_button') {
      return (
        <ActionButton
          busy={busyAction === `${domain}.press`}
          colors={colors}
          icon={<Power className="w-4 h-4" />}
          label="Press"
          onClick={() => runService(domain, 'press')}
        />
      );
    }

    if (domain === 'scene') {
      return (
        <ActionButton
          busy={busyAction === 'scene.turn_on'}
          colors={colors}
          icon={<Play className="w-4 h-4" />}
          label="Activate"
          onClick={() => runService('scene', 'turn_on')}
        />
      );
    }

    if (domain === 'script') {
      return (
        <ActionButton
          busy={busyAction === 'script.turn_on'}
          colors={colors}
          icon={<Play className="w-4 h-4" />}
          label="Run"
          onClick={() => runService('script', 'turn_on')}
        />
      );
    }

    if (domain === 'automation') {
      return (
        <>
          <ActionButton
            busy={busyAction === 'automation.trigger'}
            colors={colors}
            icon={<Play className="w-4 h-4" />}
            label="Trigger"
            onClick={() => runService('automation', 'trigger')}
          />
          <ActionButton
            busy={busyAction === `automation.${currentValue === 'on' ? 'turn_off' : 'turn_on'}`}
            colors={colors}
            icon={<Power className="w-4 h-4" />}
            label={currentValue === 'on' ? 'Disable' : 'Enable'}
            onClick={() => runService('automation', currentValue === 'on' ? 'turn_off' : 'turn_on')}
          />
        </>
      );
    }

    if (domain === 'cover') {
      return (
        <>
          <ActionButton
            busy={busyAction === 'cover.open_cover'}
            colors={colors}
            icon={<Play className="w-4 h-4" />}
            label="Open"
            onClick={() => runService('cover', 'open_cover')}
          />
          <ActionButton
            busy={busyAction === 'cover.stop_cover'}
            colors={colors}
            icon={<Square className="w-4 h-4" />}
            label="Stop"
            onClick={() => runService('cover', 'stop_cover')}
          />
          <ActionButton
            busy={busyAction === 'cover.close_cover'}
            colors={colors}
            icon={<Power className="w-4 h-4" />}
            label="Close"
            onClick={() => runService('cover', 'close_cover')}
          />
        </>
      );
    }

    if (domain === 'lock') {
      const locked = currentValue === 'locked';
      return (
        <ActionButton
          busy={busyAction === `lock.${locked ? 'unlock' : 'lock'}`}
          colors={colors}
          icon={locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          label={locked ? 'Unlock' : 'Lock'}
          onClick={() => runService('lock', locked ? 'unlock' : 'lock')}
        />
      );
    }

    if (domain === 'media_player') {
      return (
        <>
          <ActionButton
            busy={busyAction === 'media_player.media_play_pause'}
            colors={colors}
            icon={<Volume2 className="w-4 h-4" />}
            label="Play/Pause"
            onClick={() => runService('media_player', 'media_play_pause')}
          />
          <ActionButton
            busy={busyAction === 'media_player.media_stop'}
            colors={colors}
            icon={<Square className="w-4 h-4" />}
            label="Stop"
            onClick={() => runService('media_player', 'media_stop')}
          />
        </>
      );
    }

    return (
      <ActionButton
        busy={busyAction === 'homeassistant.toggle'}
        colors={colors}
        icon={<Power className="w-4 h-4" />}
        label="Toggle"
        onClick={() => runService('homeassistant', 'toggle')}
      />
    );
  };

  if (!state) {
    return (
      <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-2">Controls</h2>
        <p className="text-slate-500">No live state is available for this entity.</p>
      </section>
    );
  }

  return (
    <section className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Controls</h2>

      {canRenderPrimary ? (
        <div className="flex flex-wrap gap-2">
          {renderPrimaryAction()}
        </div>
      ) : (
        <p className="text-sm text-slate-500">This entity does not expose direct controls here.</p>
      )}

      {domain === 'light' && attrs.brightness !== undefined && (
        <RangeControl
          label="Brightness"
          max={255}
          min={1}
          onCommit={(value) => runService('light', 'turn_on', { brightness: value })}
          value={attrs.brightness || 1}
        />
      )}

      {domain === 'fan' && attrs.percentage !== undefined && (
        <RangeControl
          label="Fan Speed"
          max={100}
          min={0}
          onCommit={(value) => runService('fan', 'set_percentage', { percentage: value })}
          suffix="%"
          value={attrs.percentage || 0}
        />
      )}

      {domain === 'cover' && attrs.current_position !== undefined && (
        <RangeControl
          label="Position"
          max={100}
          min={0}
          onCommit={(value) => runService('cover', 'set_cover_position', { position: value })}
          suffix="%"
          value={attrs.current_position || 0}
        />
      )}
    </section>
  );
};

const ActionButton = ({ busy, colors, icon, label, onClick }) => (
  <button
    onClick={onClick}
    disabled={busy}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
    style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
  >
    {busy ? <RotateCw className="w-4 h-4 animate-spin" /> : icon}
    {label}
  </button>
);

const RangeControl = ({ label, min, max, value, suffix = '', onCommit }) => {
  const [draft, setDraft] = useState(value);

  React.useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-200">{draft}{suffix}</span>
      </div>
      <div className="flex items-center gap-3">
        <Zap className="w-4 h-4 text-slate-500" />
        <input
          type="range"
          min={min}
          max={max}
          value={draft}
          onChange={(event) => setDraft(Number(event.target.value))}
          onMouseUp={() => onCommit(draft)}
          onTouchEnd={() => onCommit(draft)}
          className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, mono = false }) => (
  <div className="py-2 border-b border-slate-700/50 last:border-b-0">
    <p className="text-sm text-slate-500 mb-1">{label}</p>
    <p className={`text-sm text-slate-200 break-all ${mono ? 'font-mono text-xs' : ''}`}>
      {value || 'Unknown'}
    </p>
  </div>
);

const StatusPill = ({ children, icon = null, tone }) => {
  const tones = {
    green: 'bg-green-500/20 text-green-400',
    red: 'bg-red-500/20 text-red-400',
    slate: 'bg-slate-700 text-slate-400'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${tones[tone] || tones.slate}`}>
      {icon}
      {children}
    </span>
  );
};

export default EntityDetailView;
