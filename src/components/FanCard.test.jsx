import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import FanCard from './FanCard';
import { AccentColorProvider } from '../context/AccentColorContext';

const createEntities = ({ fanState = 'off', fanSpeed = 0, lightState = 'off', lightAttributes = {}, oscillationState = 'off' } = {}) => ({
  'fan.air_circulator': {
    state: fanState,
    attributes: {
      percentage: fanSpeed,
      preset_mode: 'Normal',
      preset_modes: ['Normal', 'Natural', 'Sleep', 'Auto', 'Turbo', 'Custom'],
    },
  },
  'sensor.air_circulator_temperature': {
    state: '22',
    attributes: {},
  },
  'switch.air_circulator_horizontally_oscillating': {
    state: oscillationState,
    attributes: {},
  },
  'light.air_circulator_rgb_light': {
    state: lightState,
    attributes: lightAttributes,
  },
  'select.air_circulator_oscillation_direction': {
    state: 'horizontal',
    attributes: {},
  },
  'number.air_circulator_fan_angle_horizontal': {
    state: '0',
    attributes: { min: -60, max: 60, step: 5 },
  },
  'number.air_circulator_fan_angle_vertical': {
    state: '0',
    attributes: { min: -30, max: 90, step: 5 },
  },
});

const fanMocks = vi.hoisted(() => ({
  callService: vi.fn(() => Promise.resolve()),
  entities: {},
}));

vi.mock('../context/HomeAssistantContext', () => ({
  useHomeAssistant: () => ({
    callService: fanMocks.callService,
  }),
  useHassEntity: (entityId, mockData = {}) => {
    const entity = fanMocks.entities[entityId];
    return {
      state: entity?.state ?? mockData.state ?? 'unavailable',
      attributes: entity?.attributes ?? mockData.attributes ?? {},
      isActive: entity?.state === 'on',
      isMock: !entity,
      displayName: entityId,
    };
  },
}));

const renderFanCard = (props = {}) => render(
  <AccentColorProvider>
    <FanCard disableAnimation {...props} />
  </AccentColorProvider>
);

describe('FanCard optimistic controls', () => {
  beforeEach(() => {
    fanMocks.callService.mockClear();
    fanMocks.entities = createEntities();
    vi.stubGlobal('requestAnimationFrame', (callback) => window.setTimeout(callback, 16));
    vi.stubGlobal('cancelAnimationFrame', (id) => window.clearTimeout(id));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows fan power locally before sending the HA fan service', async () => {
    renderFanCard();

    fireEvent.click(screen.getByLabelText('Toggle Dreo fan'));

    expect(await screen.findByText('35% Power')).toBeInTheDocument();
    await waitFor(() => {
      expect(fanMocks.callService).toHaveBeenCalledWith('fan', 'turn_on', {
        entity_id: 'fan.air_circulator',
        percentage: 35,
      });
    });
  });

  it('updates fan speed locally before sending the HA percentage service', async () => {
    fanMocks.entities = createEntities({ fanState: 'on', fanSpeed: 20 });
    renderFanCard();

    fireEvent.input(screen.getByLabelText('Dreo fan speed'), { target: { value: '72' } });

    expect(await screen.findByText('72% Power')).toBeInTheDocument();
    await waitFor(() => {
      expect(fanMocks.callService).toHaveBeenCalledWith('fan', 'set_percentage', {
        entity_id: 'fan.air_circulator',
        percentage: 72,
      });
    });
  });

  it('adds the Dreo RGB light control and updates it optimistically', async () => {
    renderFanCard();

    fireEvent.click(screen.getByText('RGB Light'));

    await waitFor(() => {
      expect(fanMocks.callService).toHaveBeenCalledWith('light', 'turn_on', {
        entity_id: 'light.air_circulator_rgb_light',
      });
    });
  });

  it('reflects the current Dreo RGB light color on the card control', () => {
    fanMocks.entities = createEntities({
      lightState: 'on',
      lightAttributes: {
        rgb_color: [255, 128, 0],
        brightness: 200,
        effect: 'Circle',
        effect_list: ['Constant', 'Circle', 'Breath'],
      },
    });
    renderFanCard();

    expect(screen.getByLabelText('Toggle Dreo RGB light').style.getPropertyValue('--rgb-light-color')).toBe('rgb(255, 128, 0)');
  });

  it('opens the shared light color picker from the Dreo RGB long-press affordance', () => {
    const onColorPicker = vi.fn();
    renderFanCard({ onColorPicker });

    fireEvent.contextMenu(screen.getByText('RGB Light'));

    expect(onColorPicker).toHaveBeenCalledWith('light.air_circulator_rgb_light');
  });

  it('opens precise fan position control and writes horizontal angle updates', async () => {
    renderFanCard();

    fireEvent.contextMenu(screen.getByText('Oscillation'));

    expect(screen.getByLabelText('Dreo fan position control')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Nudge Dreo fan right'));

    await waitFor(() => {
      expect(fanMocks.callService).toHaveBeenCalledWith('select', 'select_option', {
        entity_id: 'select.air_circulator_oscillation_direction',
        option: 'fixed',
      });
      expect(fanMocks.callService).toHaveBeenCalledWith('number', 'set_value', {
        entity_id: 'number.air_circulator_fan_angle_horizontal',
        value: 5,
      });
    });
  });

  it('cycles Dreo preset mode directly from the mode button', async () => {
    renderFanCard();

    fireEvent.click(screen.getByLabelText('Cycle Dreo preset mode'));

    expect(await screen.findByText('Natural')).toBeInTheDocument();
    await waitFor(() => {
      expect(fanMocks.callService).toHaveBeenCalledWith('fan', 'set_preset_mode', {
        entity_id: 'fan.air_circulator',
        preset_mode: 'Natural',
      });
    });
  });

  it('opens preset modes and writes the selected mode', async () => {
    renderFanCard();

    fireEvent.contextMenu(screen.getByLabelText('Cycle Dreo preset mode'));

    expect(screen.getByLabelText('Dreo fan preset modes')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Set Dreo fan mode Turbo'));

    expect(await screen.findByLabelText('Turbo mode active')).toBeInTheDocument();
    expect(screen.queryByLabelText('Dreo fan speed')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(fanMocks.callService).toHaveBeenCalledWith('fan', 'set_preset_mode', {
        entity_id: 'fan.air_circulator',
        preset_mode: 'Turbo',
      });
    });
  });

  it('centers vertical angle at zero', async () => {
    renderFanCard();

    fireEvent.contextMenu(screen.getByText('Oscillation'));
    fireEvent.input(screen.getByLabelText('Dreo fan vertical angle'), { target: { value: '40' } });
    fireEvent.click(screen.getByLabelText('Center Dreo fan'));

    await waitFor(() => {
      expect(fanMocks.callService).toHaveBeenCalledWith('number', 'set_value', {
        entity_id: 'number.air_circulator_fan_angle_vertical',
        value: 0,
      });
    });
  });
});
