import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Download,
  ExternalLink,
  PackageOpen,
  Play,
  Plus,
  Puzzle,
  RefreshCw,
  RotateCw,
  Settings,
  Square,
  X
} from 'lucide-react';
import { useSettingsNav } from '../SettingsView';
import { useAccentColor } from '../../context/AccentColorContext';
import { useHomeAssistant } from '../../context/HomeAssistantContext';
import haClient from '../../services/haClient';

const TABS = {
  INSTALLED: 'installed',
  STORE: 'store',
  REPOSITORIES: 'repositories'
};

const extractList = (payload, key) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  return [];
};

const isAddonInstalled = (addon) => Boolean(addon.installed);

const isAddonRunning = (addon) => addon.state === 'started' || addon.state === 'running';

const displayVersion = (addon) => {
  if (typeof addon.installed === 'string') return addon.installed;
  return addon.version || addon.version_latest || 'Unknown';
};

const getAddonSlug = (addon) => addon.slug || addon.name;

const formatPayload = (payload) => {
  if (payload === null || payload === undefined || payload === '') return '';
  if (typeof payload === 'string') return payload;
  return JSON.stringify(payload, null, 2);
};

const extractLogs = (payload) => {
  if (typeof payload === 'string') return payload;
  if (typeof payload?.data === 'string') return payload.data;
  if (typeof payload?.logs === 'string') return payload.logs;
  return formatPayload(payload);
};

const isUnauthorizedError = (err) =>
  err?.code === 'unauthorized' ||
  err?.message?.toLowerCase().includes('unauthorized');

const mergeAddons = (storeAddons, installedAddons) => {
  const bySlug = new Map();

  storeAddons.forEach((addon) => {
    const slug = getAddonSlug(addon);
    if (slug) bySlug.set(slug, addon);
  });

  installedAddons.forEach((addon) => {
    const slug = getAddonSlug(addon);
    if (!slug) return;
    bySlug.set(slug, {
      ...(bySlug.get(slug) || {}),
      ...addon,
      installed: addon.installed || true
    });
  });

  return Array.from(bySlug.values()).sort((a, b) =>
    (a.name || a.slug || '').localeCompare(b.name || b.slug || '')
  );
};

const AddonsView = () => {
  const { navigate } = useSettingsNav();
  const { colors } = useAccentColor();
  const { connectionStatus, getHAConnection } = useHomeAssistant();
  const getHAConnectionRef = useRef(getHAConnection);
  const [hasSupervisor, setHasSupervisor] = useState(null);
  const [addons, setAddons] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [activeTab, setActiveTab] = useState(TABS.INSTALLED);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionKey, setActionKey] = useState('');
  const [selectedAddon, setSelectedAddon] = useState(null);
  const [detailTab, setDetailTab] = useState('info');
  const [detailInfo, setDetailInfo] = useState(null);
  const [detailLogs, setDetailLogs] = useState('');
  const [detailWebUiUrl, setDetailWebUiUrl] = useState('');
  const [detailOptionsText, setDetailOptionsText] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSaving, setDetailSaving] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    getHAConnectionRef.current = getHAConnection;
  }, [getHAConnection]);

  const getHABaseUrl = useCallback(() => {
    const haConnection = getHAConnectionRef.current?.();
    return haConnection?.hassUrl || haConnection?.url || '';
  }, []);

  const loadAddons = useCallback(async () => {
    const haConnection = getHAConnectionRef.current?.();

    if (!haConnection?.connected) {
      setLoading(false);
      setHasSupervisor(null);
      setError('Connect to Home Assistant to manage add-ons.');
      return;
    }

    haClient.setHAConnection(haConnection);
    setLoading(true);
    setError('');

    try {
      await haClient.callSupervisorApi('GET', '/supervisor/info');
      setHasSupervisor(true);

      const [addonsResult, storeResult] = await Promise.allSettled([
        haClient.callSupervisorApi('GET', '/addons'),
        haClient.callSupervisorApi('GET', '/store')
      ]);

      if (addonsResult.status === 'rejected' && storeResult.status === 'rejected') {
        throw addonsResult.reason || storeResult.reason;
      }

      const installedList = addonsResult.status === 'fulfilled'
        ? extractList(addonsResult.value, 'addons')
        : [];
      const storeList = storeResult.status === 'fulfilled'
        ? extractList(storeResult.value, 'addons')
        : [];
      const repositoryList = storeResult.status === 'fulfilled'
        ? extractList(storeResult.value, 'repositories')
        : [];

      setAddons(mergeAddons(storeList, installedList));
      setRepositories(repositoryList);

      if (storeResult.status === 'rejected') {
        setError('Installed add-ons loaded, but the add-on store could not be reached.');
      }
    } catch (err) {
      if (err.message?.includes('HTTP 404')) {
        setHasSupervisor(false);
        setAddons([]);
        setRepositories([]);
        setError('');
      } else if (isUnauthorizedError(err)) {
        setHasSupervisor(true);
        setAddons([]);
        setRepositories([]);
        setError('Supervisor add-ons require an administrator Home Assistant token.');
      } else {
        setHasSupervisor(true);
        setError(err.message || 'Failed to load add-ons.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadAddons();
      return;
    }

    setLoading(false);
    setHasSupervisor(null);
    setAddons([]);
    setRepositories([]);
    setError('Connect to Home Assistant to manage add-ons.');
  }, [connectionStatus, loadAddons]);

  const installedAddons = useMemo(() => addons.filter(isAddonInstalled), [addons]);
  const availableAddons = useMemo(() => addons.filter((addon) => !isAddonInstalled(addon)), [addons]);
  const blockingError = Boolean(error && addons.length === 0 && !loading);

  const resolveAddonUrl = useCallback((url) => {
    const baseUrl = getHABaseUrl();
    if (!url || !baseUrl) return '';

    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }

    if (url.includes('[HOST]')) {
      try {
        return url.replace('[HOST]', new URL(baseUrl).hostname);
      } catch {
        return url;
      }
    }

    return url;
  }, [getHABaseUrl]);

  const openAddonDetails = useCallback(async (addon, tab = 'info') => {
    const slug = getAddonSlug(addon);
    if (!slug) return;

    setSelectedAddon(addon);
    setDetailTab(tab);
    setDetailInfo(null);
    setDetailLogs('');
    setDetailWebUiUrl('');
    setDetailOptionsText('');
    setDetailLoading(true);
    setDetailError('');

    try {
      const [infoResult, logsResult] = await Promise.allSettled([
        haClient.callSupervisorApi('GET', `/addons/${slug}/info`),
        haClient.callSupervisorApi('GET', `/addons/${slug}/logs`)
      ]);

      const info = infoResult.status === 'fulfilled' ? infoResult.value : null;
      const mergedInfo = { ...addon, ...(info || {}) };
      const options = mergedInfo.options || mergedInfo.configuration || {};

      setDetailInfo(mergedInfo);
      setDetailOptionsText(formatPayload(options || {}));
      setDetailWebUiUrl(resolveAddonUrl(mergedInfo.webui || mergedInfo.ingress_url));

      if (logsResult.status === 'fulfilled') {
        setDetailLogs(extractLogs(logsResult.value));
      }

      if (infoResult.status === 'rejected' && logsResult.status === 'rejected') {
        throw infoResult.reason || logsResult.reason;
      }

      if (infoResult.status === 'rejected') {
        setDetailError(`Loaded store data, but add-on details could not be reached: ${infoResult.reason?.message || 'unknown error'}`);
      }
    } catch (err) {
      setDetailInfo(addon);
      setDetailError(`Could not load ${addon.name || slug}: ${err.message || 'unknown error'}`);
    } finally {
      setDetailLoading(false);
    }
  }, [resolveAddonUrl]);

  const openWebUi = useCallback(async (addon) => {
    const slug = getAddonSlug(addon);
    if (!slug) return;

    setActionKey(`${slug}:webui`);
    await openAddonDetails(addon, 'webui');
    setActionKey('');
  }, [openAddonDetails]);

  const saveAddonOptions = useCallback(async () => {
    const addon = detailInfo || selectedAddon;
    const slug = addon ? getAddonSlug(addon) : '';
    if (!slug) return;

    setDetailSaving(true);
    setDetailError('');

    try {
      const options = detailOptionsText.trim() ? JSON.parse(detailOptionsText) : {};
      await haClient.callSupervisorApi('POST', `/addons/${slug}/options`, options);
      await openAddonDetails(addon, 'config');
      await loadAddons();
    } catch (err) {
      setDetailError(err instanceof SyntaxError
        ? 'Configuration must be valid JSON.'
        : `Could not save configuration: ${err.message || 'unknown error'}`);
    } finally {
      setDetailSaving(false);
    }
  }, [detailInfo, detailOptionsText, loadAddons, openAddonDetails, selectedAddon]);

  const runAddonAction = useCallback(async (addon, action) => {
    const slug = getAddonSlug(addon);
    if (!slug) return;

    const actionPaths = {
      start: `/addons/${slug}/start`,
      stop: `/addons/${slug}/stop`,
      restart: `/addons/${slug}/restart`,
      install: `/store/addons/${slug}/install`,
      update: `/store/addons/${slug}/update`
    };

    const payloads = {
      install: { background: false },
      update: { backup: false, background: false }
    };

    setActionKey(`${slug}:${action}`);
    setError('');

    try {
      await haClient.callSupervisorApi('POST', actionPaths[action], payloads[action] || null, {
        timeout: action === 'install' || action === 'update' ? 300 : undefined
      });
      await loadAddons();
    } catch (err) {
      setError(`Could not ${action} ${addon.name || slug}: ${err.message || 'unknown error'}`);
    } finally {
      setActionKey('');
    }
  }, [loadAddons]);

  if (hasSupervisor === false) {
    return (
      <div className="space-y-6">
        <AddonsHeader
          colors={colors}
          navigate={navigate}
          installedCount={0}
          onRefresh={loadAddons}
          loading={loading}
          onStoreClick={() => setActiveTab(TABS.STORE)}
        />

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">Add-ons Not Available</h3>
          <p className="text-slate-500 mb-4 max-w-md mx-auto">
            Add-ons require Home Assistant OS or a supervised installation with Supervisor.
          </p>
          <p className="text-sm text-slate-600">
            This Home Assistant instance did not expose the Supervisor API.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AddonsHeader
        colors={colors}
        navigate={navigate}
        installedCount={installedAddons.length}
        onRefresh={loadAddons}
        loading={loading}
        onStoreClick={() => setActiveTab(TABS.STORE)}
      />

      <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
        <TabButton
          active={activeTab === TABS.INSTALLED}
          label="Installed"
          count={installedAddons.length}
          colors={colors}
          onClick={() => setActiveTab(TABS.INSTALLED)}
        />
        <TabButton
          active={activeTab === TABS.STORE}
          label="Add-on Store"
          count={availableAddons.length}
          colors={colors}
          onClick={() => setActiveTab(TABS.STORE)}
        />
        <TabButton
          active={activeTab === TABS.REPOSITORIES}
          label="Repositories"
          count={repositories.length}
          colors={colors}
          onClick={() => setActiveTab(TABS.REPOSITORIES)}
        />
      </div>

      {error && !blockingError && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && addons.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : blockingError ? (
        <AddonsErrorState
          error={error}
          colors={colors}
          onOpenStore={() => {
            setActiveTab(TABS.STORE);
            loadAddons();
          }}
        />
      ) : (
        <>
          {activeTab === TABS.INSTALLED && (
            <InstalledAddons
              addons={installedAddons}
              colors={colors}
              actionKey={actionKey}
              onStoreClick={() => setActiveTab(TABS.STORE)}
              onOpenWebUi={openWebUi}
              onOpenSettings={(addon) => openAddonDetails(addon, 'config')}
              onAction={runAddonAction}
            />
          )}

          {activeTab === TABS.STORE && (
            <StoreAddons
              addons={availableAddons}
              colors={colors}
              actionKey={actionKey}
              onInstall={(addon) => runAddonAction(addon, 'install')}
            />
          )}

          {activeTab === TABS.REPOSITORIES && (
            <Repositories repositories={repositories} />
          )}
        </>
      )}

      <AddonDetailsModal
        addon={selectedAddon}
        colors={colors}
        detailError={detailError}
        info={detailInfo}
        loading={detailLoading}
        logs={detailLogs}
        onClose={() => {
          setSelectedAddon(null);
          setDetailInfo(null);
          setDetailError('');
        }}
        onOptionsChange={setDetailOptionsText}
        onSaveOptions={saveAddonOptions}
        onTabChange={setDetailTab}
        optionsText={detailOptionsText}
        saving={detailSaving}
        tab={detailTab}
        webUiUrl={detailWebUiUrl}
      />
    </div>
  );
};

const AddonsHeader = ({ colors, navigate, installedCount, onRefresh, loading, onStoreClick }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-4">
      <button
        onClick={() => navigate('/settings')}
        className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
        title="Back to settings"
      >
        <ArrowLeft className="w-5 h-5 text-slate-400" />
      </button>
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Add-ons</h1>
        <p className="text-slate-400 mt-1">
          {installedCount} add-on{installedCount === 1 ? '' : 's'} installed
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <button
        onClick={onRefresh}
        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
        title="Refresh add-ons"
        disabled={loading}
      >
        <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
      </button>
      <button
        onClick={onStoreClick}
        className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
      >
        <Plus className="w-4 h-4" />
        Add-on Store
      </button>
    </div>
  </div>
);

const TabButton = ({ active, label, count, colors, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
    style={{
      borderColor: active ? colors.accent : 'transparent',
      color: active ? colors.accent : '#94a3b8'
    }}
  >
    {label}
    <span className="ml-2 text-xs text-slate-500">{count}</span>
  </button>
);

const AddonsErrorState = ({ error, colors, onOpenStore }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-slate-300 mb-2">Could not load add-ons</h3>
    <p className="text-slate-500 mb-6 max-w-lg mx-auto">{error}</p>
    <button
      onClick={onOpenStore}
      className="px-6 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
      style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
    >
      <PackageOpen className="w-4 h-4" />
      Show Add-on Store
    </button>
  </div>
);

const InstalledAddons = ({ addons, colors, actionKey, onStoreClick, onOpenWebUi, onOpenSettings, onAction }) => {
  if (addons.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
        <Puzzle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No add-ons installed</h3>
        <p className="text-slate-500 mb-6">Browse the add-on store to extend Home Assistant</p>
        <button
          onClick={onStoreClick}
          className="px-6 py-2 rounded-lg transition-colors"
          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Browse Add-on Store
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {addons.map((addon) => (
        <AddonCard
          key={getAddonSlug(addon)}
          addon={addon}
          actionKey={actionKey}
          onOpenWebUi={onOpenWebUi}
          onOpenSettings={onOpenSettings}
          onAction={onAction}
        />
      ))}
    </div>
  );
};

const StoreAddons = ({ addons, colors, actionKey, onInstall }) => {
  if (addons.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
        <PackageOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">Store is empty</h3>
        <p className="text-slate-500">No installable add-ons were returned by Supervisor.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {addons.map((addon) => {
        const slug = getAddonSlug(addon);
        const busy = actionKey === `${slug}:install`;

        return (
          <div
            key={slug}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-slate-700/50">
                <Puzzle className="w-6 h-6 text-slate-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-slate-100 font-medium truncate">{addon.name || slug}</h3>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                  {addon.description || 'No description provided.'}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                  <span>Version {displayVersion(addon)}</span>
                  {addon.repository && <span>{addon.repository}</span>}
                  {addon.stage && <span className="capitalize">{addon.stage}</span>}
                </div>
              </div>
              <button
                onClick={() => onInstall(addon)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                title="Install"
                disabled={busy}
                style={{ color: colors.accent }}
              >
                {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Repositories = ({ repositories }) => {
  if (repositories.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-12 text-center">
        <PackageOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-300 mb-2">No repositories found</h3>
        <p className="text-slate-500">Supervisor did not return add-on repository details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {repositories.map((repository) => (
        <div
          key={repository.slug || repository.source || repository.url}
          className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-slate-100 font-medium">{repository.name || repository.slug}</h3>
              <p className="text-sm text-slate-400 mt-1 truncate">{repository.source || repository.url}</p>
              {repository.maintainer && (
                <p className="text-xs text-slate-500 mt-2">Maintained by {repository.maintainer}</p>
              )}
            </div>
            {repository.url && (
              <span className="max-w-xs truncate text-xs text-slate-500" title={repository.url}>
                {repository.url}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const AddonDetailsModal = ({
  addon,
  colors,
  detailError,
  info,
  loading,
  logs,
  onClose,
  onOptionsChange,
  onSaveOptions,
  onTabChange,
  optionsText,
  saving,
  tab,
  webUiUrl
}) => {
  if (!addon) return null;

  const details = info || addon;
  const slug = getAddonSlug(details);
  const tabItems = [
    { id: 'info', label: 'Info' },
    { id: 'config', label: 'Configuration' },
    { id: 'logs', label: 'Logs' },
    { id: 'webui', label: 'Web UI' }
  ];

  const renderBody = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      );
    }

    if (tab === 'config') {
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Options JSON</h3>
            <textarea
              value={optionsText}
              onChange={(event) => onOptionsChange(event.target.value)}
              className="min-h-[260px] w-full resize-y rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 outline-none focus:border-amber-500"
              spellCheck={false}
            />
          </div>

          {details.schema && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Schema</h3>
              <pre className="max-h-52 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300">
                {formatPayload(details.schema)}
              </pre>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onSaveOptions}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm transition-colors disabled:opacity-50"
              style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      );
    }

    if (tab === 'logs') {
      return logs ? (
        <pre className="max-h-[520px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-300">
          {logs}
        </pre>
      ) : (
        <EmptyDetail icon={<AlertCircle className="h-10 w-10 text-slate-600" />} text="No logs were returned for this add-on." />
      );
    }

    if (tab === 'webui') {
      return webUiUrl ? (
        <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
          <iframe
            src={webUiUrl}
            title={`${details.name || slug} web UI`}
            className="h-[520px] w-full bg-slate-950"
          />
        </div>
      ) : (
        <EmptyDetail icon={<ExternalLink className="h-10 w-10 text-slate-600" />} text="This add-on did not report an internal web UI URL." />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <DetailRow label="Slug" value={slug} mono />
        <DetailRow label="State" value={details.state || 'Unknown'} />
        <DetailRow label="Version" value={displayVersion(details)} />
        <DetailRow label="Latest" value={details.version_latest || details.version || 'Unknown'} />
        <DetailRow label="Repository" value={details.repository || details.repository_name || 'Unknown'} />
        <DetailRow label="Stage" value={details.stage || 'Stable'} />
        <DetailRow label="Boot" value={details.boot || 'Unknown'} />
        <DetailRow label="Ingress" value={details.ingress ? 'Available' : 'Unavailable'} />
        <div className="md:col-span-2 rounded-lg bg-slate-950/70 p-3">
          <p className="mb-1 text-xs uppercase tracking-widest text-slate-500">Description</p>
          <p className="text-sm text-slate-300">{details.description || 'No description provided.'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div className="min-w-0">
            <h2 className="truncate text-2xl font-semibold text-slate-100">{details.name || slug}</h2>
            <p className="mt-1 truncate text-sm text-slate-500">{slug}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-slate-800"
            title="Close"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="border-b border-slate-800 px-5">
          <div className="flex gap-2 overflow-x-auto">
            {tabItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="border-b-2 px-3 py-3 text-sm font-medium transition-colors"
                style={{
                  borderColor: tab === item.id ? colors.accent : 'transparent',
                  color: tab === item.id ? colors.accent : '#94a3b8'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[calc(90vh-150px)] overflow-y-auto p-5">
          {detailError && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{detailError}</span>
            </div>
          )}
          {renderBody()}
        </div>
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, mono = false }) => (
  <div className="min-w-0 rounded-lg bg-slate-950/70 p-3">
    <p className="mb-1 text-xs uppercase tracking-widest text-slate-500">{label}</p>
    <p className={`truncate text-sm text-slate-200 ${mono ? 'font-mono' : ''}`} title={String(value)}>
      {String(value)}
    </p>
  </div>
);

const EmptyDetail = ({ icon, text }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50 py-16 text-center">
    {icon}
    <p className="mt-3 text-sm text-slate-500">{text}</p>
  </div>
);

const AddonCard = ({ addon, actionKey, onOpenWebUi, onOpenSettings, onAction }) => {
  const slug = getAddonSlug(addon);
  const isRunning = isAddonRunning(addon);
  const busyAction = actionKey.startsWith(`${slug}:`);
  const version = displayVersion(addon);
  const stateLabel = isRunning ? 'Running' : addon.state || 'Stopped';

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <div className={`p-3 rounded-lg ${isRunning ? 'bg-green-500/10' : 'bg-slate-700/50'}`}>
            <Puzzle className={`w-6 h-6 ${isRunning ? 'text-green-400' : 'text-slate-500'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-slate-100 font-medium truncate">{addon.name || slug}</h3>
            <p className="text-sm text-slate-400 mt-1 line-clamp-2">
              {addon.description || 'No description provided.'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              <span>Version {version}</span>
              <span className={isRunning ? 'text-green-400' : 'text-slate-500'}>{stateLabel}</span>
              {addon.update_available && <span className="text-amber-400">Update available</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          {addon.update_available && (
            <IconButton
              title="Update"
              busy={actionKey === `${slug}:update`}
              onClick={() => onAction(addon, 'update')}
              icon={<Download className="w-4 h-4 text-amber-300" />}
            />
          )}
          <IconButton
            title="Open Web UI"
            busy={actionKey === `${slug}:webui`}
            onClick={() => onOpenWebUi(addon)}
            icon={<ExternalLink className="w-4 h-4 text-slate-400" />}
          />
          <IconButton
            title="Restart"
            busy={actionKey === `${slug}:restart`}
            disabled={!isRunning || busyAction}
            onClick={() => onAction(addon, 'restart')}
            icon={<RotateCw className="w-4 h-4 text-slate-400" />}
          />
          <IconButton
            title="Configuration"
            disabled={busyAction}
            onClick={() => onOpenSettings(addon)}
            icon={<Settings className="w-4 h-4 text-slate-400" />}
          />
          <IconButton
            title={isRunning ? 'Stop' : 'Start'}
            busy={actionKey === `${slug}:${isRunning ? 'stop' : 'start'}`}
            disabled={busyAction}
            onClick={() => onAction(addon, isRunning ? 'stop' : 'start')}
            icon={isRunning
              ? <Square className="w-4 h-4 text-slate-400" />
              : <Play className="w-4 h-4 text-slate-400" />}
          />
        </div>
      </div>
    </div>
  );
};

const IconButton = ({ title, icon, onClick, busy = false, disabled = false }) => (
  <button
    className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
    title={title}
    onClick={onClick}
    disabled={disabled || busy}
  >
    {busy ? <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" /> : icon}
  </button>
);

export default AddonsView;
