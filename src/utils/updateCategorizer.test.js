import { describe, expect, it } from 'vitest';
import { categorizeUpdates, createUpdateEntity } from './updateCategorizer';

describe('update categorization', () => {
  it('sanitizes Home Assistant names for the bespoke shell', () => {
    const update = createUpdateEntity('update.home_assistant_core', {
      attributes: { friendly_name: 'Home Assistant Core' },
    });

    expect(update.name).toBe('Control Hub Core');
  });

  it('groups system, firmware, and add-on update entities', () => {
    const categories = categorizeUpdates({
      'update.home_assistant_core': {
        attributes: { friendly_name: 'Home Assistant Core' },
      },
      'update.home_assistant_supervisor': {
        attributes: { friendly_name: 'Home Assistant Supervisor' },
      },
      'update.esphome_firmware': {
        attributes: { friendly_name: 'Kitchen ESPHome Firmware' },
      },
      'update.zigbee2mqtt': {
        attributes: { friendly_name: 'Zigbee2MQTT' },
      },
      'sensor.unrelated': {
        state: 'on',
      },
    });

    expect(categories.system.map((item) => item.id)).toEqual([
      'update.home_assistant_core',
      'update.home_assistant_supervisor',
    ]);
    expect(categories.esphome).toHaveLength(1);
    expect(categories.addons).toHaveLength(1);
    expect(categories.other).toHaveLength(0);
  });
});
