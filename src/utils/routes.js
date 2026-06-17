export const TAB_ROUTES = {
  dashboard: '/',
  lights: '/lights',
  media: '/media',
  health: '/health',
  security: '/security',
  energy: '/energy',
  updates: '/updates',
  network: '/network',
  settings: '/settings',
  advanced: '/advanced',
};

export const SETTINGS_DETAIL_ROUTES = [
  '/settings/devices-services',
  '/settings/automations',
  '/settings/areas',
  '/settings/people',
  '/settings/integrations',
  '/settings/system',
];

export const getActiveTabFromPath = (pathname = '/') => {
  const segment = pathname.split('/').filter(Boolean)[0];
  if (!segment) return 'dashboard';
  if (segment === 'settings') return 'settings';
  return TAB_ROUTES[segment] ? segment : 'dashboard';
};

export const getRouteForTab = (tabId) => TAB_ROUTES[tabId] || TAB_ROUTES.dashboard;
