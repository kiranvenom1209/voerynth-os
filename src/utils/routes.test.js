import { describe, expect, it } from 'vitest';
import {
  SETTINGS_DETAIL_ROUTES,
  TAB_ROUTES,
  getActiveTabFromPath,
  getRouteForTab,
} from './routes';

describe('route contract', () => {
  it('maps primary tabs to stable hash-safe paths', () => {
    expect(TAB_ROUTES).toMatchObject({
      dashboard: '/',
      lights: '/lights',
      media: '/media',
      health: '/health',
      security: '/security',
      energy: '/energy',
      updates: '/updates',
      network: '/network',
      settings: '/settings',
    });
  });

  it('derives the active tab from primary and detail routes', () => {
    expect(getActiveTabFromPath('/')).toBe('dashboard');
    expect(getActiveTabFromPath('/lights')).toBe('lights');
    expect(getActiveTabFromPath('/settings/devices-services/entity/light.kitchen')).toBe('settings');
    expect(getActiveTabFromPath('/unknown')).toBe('dashboard');
  });

  it('exposes settings detail routes for deep-link coverage', () => {
    expect(SETTINGS_DETAIL_ROUTES).toContain('/settings/devices-services');
    expect(SETTINGS_DETAIL_ROUTES).toContain('/settings/system');
    expect(getRouteForTab('network')).toBe('/network');
    expect(getRouteForTab('missing')).toBe('/');
  });
});
