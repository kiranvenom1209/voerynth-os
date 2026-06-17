import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LightsView from './LightsView';
import { AccentColorProvider } from '../context/AccentColorContext';

const lightsMocks = vi.hoisted(() => ({
  callService: vi.fn(() => Promise.resolve()),
  hassStates: {},
}));

vi.mock('../context/HomeAssistantContext', () => ({
  useHomeAssistant: () => ({
    callService: lightsMocks.callService,
    hassStates: lightsMocks.hassStates,
  }),
}));

vi.mock('../components/FanCard', () => ({
  default: () => <div data-testid="fan-card" />,
}));

vi.mock('../components/LightCard', () => ({
  default: ({ lightConfig }) => <div data-testid={`light-card-${lightConfig.id}`} />,
}));

const renderLightsView = () => render(
  <AccentColorProvider>
    <LightsView />
  </AccentColorProvider>
);

const holdLongPress = (element) => {
  fireEvent.mouseDown(element);
  act(() => {
    vi.advanceTimersByTime(650);
  });
  fireEvent.mouseUp(element);
};

const getLivingRoomWarmButton = () => (
  screen.getAllByRole('button', { name: 'Activate Warm scene' })[0]
);

describe('LightsView scene long press', () => {
  beforeEach(() => {
    lightsMocks.callService.mockClear();
    lightsMocks.hassStates = {
      'scene.living_room_red': {
        state: 'scening',
        attributes: { friendly_name: 'Living room Red' },
      },
      'scene.bedroom_read': {
        state: 'scening',
        attributes: { friendly_name: 'Bedroom Reading' },
      },
      'scene.bedroom_custom_glow': {
        state: 'scening',
        attributes: { friendly_name: 'Bedroom Custom Glow' },
      },
      'scene.kitchen_late_night': {
        state: 'scening',
        attributes: { friendly_name: 'Kitchen Late Night' },
      },
    };
  });

  it('opens a room-specific HA scene picker from a scene card long press', () => {
    vi.useFakeTimers();
    renderLightsView();

    holdLongPress(screen.getByLabelText('Bedroom scenes card'));

    expect(screen.getByRole('dialog', { name: 'Bedroom scenes' })).toBeInTheDocument();
    expect(screen.getByText('Custom Glow')).toBeInTheDocument();
    expect(screen.queryByText('Bedroom Custom Glow')).not.toBeInTheDocument();
    expect(screen.queryByText('Kitchen Late Night')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('opens the same picker from a scene button long press without activating that scene', () => {
    vi.useFakeTimers();
    renderLightsView();

    holdLongPress(getLivingRoomWarmButton());

    expect(screen.getByRole('dialog', { name: 'Living Room scenes' })).toBeInTheDocument();
    expect(lightsMocks.callService).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('shortens HA scene names and applies scene-aware backgrounds', () => {
    vi.useFakeTimers();
    renderLightsView();

    holdLongPress(getLivingRoomWarmButton());

    const redScene = screen.getByRole('button', { name: 'Activate Red scene from picker' });
    expect(redScene).toHaveClass('from-red-500/25');
    expect(screen.queryByText('Living room Red')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('still activates scenes on a normal tap', async () => {
    renderLightsView();

    fireEvent.click(getLivingRoomWarmButton());

    await waitFor(() => {
      expect(lightsMocks.callService).toHaveBeenCalledWith('scene', 'turn_on', {
        entity_id: 'scene.living_room_read',
      });
    });
  });
});
