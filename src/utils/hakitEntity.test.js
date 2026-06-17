import { describe, expect, it, vi } from 'vitest';
import { createHassEntityShape } from './hakitEntity';

vi.mock('@hakit/core', () => ({
  computeDomain: (entityId) => entityId.split('.')[0],
  computeObjectId: (entityId) => entityId.split('.').slice(1).join('.'),
  computeStateName: (entity) => entity.attributes.friendly_name,
  getCssColorValue: () => null,
  isUnavailableState: (state) => state === 'unavailable' || state === 'unknown',
  lightSupportsBrightness: (entity) => entity.attributes.supported_color_modes?.includes('brightness') || false,
  lightSupportsColor: (entity) => entity.attributes.supported_color_modes?.some((mode) => mode !== 'brightness') || false,
  stateActive: (entity) => entity.state === 'on',
}));

describe('createHassEntityShape', () => {
  it('creates a safe mock shape when an entity is missing', () => {
    const entity = createHassEntityShape('sensor.front_door_battery', null, {
      state: '87',
      attributes: { friendly_name: 'Front Door Battery', unit_of_measurement: '%' },
      last_updated: '2026-06-17T10:00:00.000Z',
    });

    expect(entity.isMock).toBe(true);
    expect(entity.isUnavailable).toBe(true);
    expect(entity.displayName).toBe('Front Door Battery');
    expect(entity.domain).toBe('sensor');
    expect(entity.state).toBe('87');
  });

  it('preserves live entity metadata and active light state', () => {
    const entity = createHassEntityShape('light.bedroom_lamp', {
      entity_id: 'light.bedroom_lamp',
      state: 'on',
      attributes: {
        friendly_name: 'Bedroom Lamp',
        supported_color_modes: ['brightness'],
      },
      last_updated: '2026-06-17T11:00:00.000Z',
    });

    expect(entity.isMock).toBe(false);
    expect(entity.isUnavailable).toBe(false);
    expect(entity.isActive).toBe(true);
    expect(entity.displayName).toBe('Bedroom Lamp');
    expect(entity.supportsBrightness).toBe(true);
  });
});
