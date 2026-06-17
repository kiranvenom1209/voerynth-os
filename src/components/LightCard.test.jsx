import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LightCard from './LightCard';
import { AccentColorProvider } from '../context/AccentColorContext';

const createLightEntity = ({ isActive = true, brightness = 64 } = {}) => ({
  isActive,
  isMock: false,
  supportsBrightness: true,
  attributes: { brightness },
  displayName: 'Desk Lamp',
  color: { hexColor: '#f59e0b' },
  raw: {
    entity_id: 'light.desk_lamp',
    state: isActive ? 'on' : 'off',
    attributes: { brightness },
  },
});

const lightMocks = vi.hoisted(() => ({
  callService: vi.fn(() => Promise.resolve()),
  entity: null,
}));

vi.mock('../context/HomeAssistantContext', () => ({
  useHomeAssistant: () => ({
    callService: lightMocks.callService,
  }),
  useHassEntity: () => lightMocks.entity,
}));

vi.mock('../utils/utils', () => ({
  getEntityColor: () => '#f59e0b',
}));

const renderLightCard = (props = {}) => render(
  <AccentColorProvider>
    <LightCard
      lightConfig={{ id: 'light.desk_lamp', name: 'Desk Lamp' }}
      onColorPicker={props.onColorPicker || vi.fn()}
      index={0}
      delay={0}
      disableAnimation
    />
  </AccentColorProvider>
);

describe('LightCard brightness interaction', () => {
  beforeEach(() => {
    lightMocks.callService.mockClear();
    lightMocks.entity = createLightEntity();
  });

  it('updates brightness optimistically from the brightness slider', async () => {
    renderLightCard();

    const slider = screen.getByLabelText('Desk Lamp brightness');
    fireEvent.input(slider, { target: { value: '191' } });
    fireEvent.pointerUp(slider, { pointerId: 1 });

    expect(await screen.findByText('75%')).toBeInTheDocument();
    await waitFor(() => {
      expect(lightMocks.callService).toHaveBeenCalledWith('light', 'turn_on', {
        entity_id: 'light.desk_lamp',
        brightness: 191,
      });
    });
  });

  it('does not turn on or adjust brightness when dragging across the card body', () => {
    renderLightCard();

    const shell = screen.getByText('Desk Lamp').closest('[data-light-card-shell]');
    shell.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 120,
      width: 200,
      height: 120,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.pointerDown(shell, { pointerId: 1, clientX: 20, clientY: 60 });
    fireEvent.pointerMove(shell, { pointerId: 1, clientX: 150, clientY: 62 });
    fireEvent.pointerUp(shell, { pointerId: 1, clientX: 150, clientY: 62 });

    expect(lightMocks.callService).not.toHaveBeenCalled();
  });

  it('does not turn on or adjust brightness during a vertical phone scroll', () => {
    renderLightCard();

    const shell = screen.getByText('Desk Lamp').closest('[data-light-card-shell]');
    shell.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 120,
      width: 200,
      height: 120,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.pointerDown(shell, { pointerId: 1, clientX: 82, clientY: 10 });
    fireEvent.pointerMove(shell, { pointerId: 1, clientX: 88, clientY: 52 });
    fireEvent.pointerUp(shell, { pointerId: 1, clientX: 90, clientY: 88 });

    expect(lightMocks.callService).not.toHaveBeenCalled();
  });

  it('toggles power locally before sending the light service call', async () => {
    lightMocks.entity = createLightEntity({ isActive: false, brightness: 0 });
    renderLightCard();

    fireEvent.click(screen.getByRole('button', { name: /toggle desk lamp/i }));

    expect(await screen.findByText('100%')).toBeInTheDocument();
    await waitFor(() => {
      expect(lightMocks.callService).toHaveBeenCalledWith('light', 'turn_on', {
        entity_id: 'light.desk_lamp',
      });
    });
  });

  it('opens the color picker from a long press anywhere on the card body', () => {
    vi.useFakeTimers();
    const onColorPicker = vi.fn();
    renderLightCard({ onColorPicker });

    const body = screen.getByText('Desk Lamp').closest('[data-light-card-body]');
    fireEvent.mouseDown(body);
    act(() => {
      vi.advanceTimersByTime(650);
    });
    fireEvent.mouseUp(body);

    expect(onColorPicker).toHaveBeenCalledWith('light.desk_lamp');
    vi.useRealTimers();
  });

  it('opens the color picker from the stretched bottom area of a tall card', () => {
    vi.useFakeTimers();
    const onColorPicker = vi.fn();
    renderLightCard({ onColorPicker });

    const shell = screen.getByText('Desk Lamp').closest('[data-light-card-shell]');
    fireEvent.mouseDown(shell, { clientY: 260 });
    act(() => {
      vi.advanceTimersByTime(650);
    });
    fireEvent.mouseUp(shell, { clientY: 260 });

    expect(onColorPicker).toHaveBeenCalledWith('light.desk_lamp');
    vi.useRealTimers();
  });

  it('does not open the color picker from the power button zone long press', () => {
    vi.useFakeTimers();
    const onColorPicker = vi.fn();
    renderLightCard({ onColorPicker });

    fireEvent.mouseDown(screen.getByRole('button', { name: /toggle desk lamp/i }));
    act(() => {
      vi.advanceTimersByTime(650);
    });
    fireEvent.mouseUp(screen.getByRole('button', { name: /toggle desk lamp/i }));

    expect(onColorPicker).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('cancels the color picker long press when touch movement becomes a scroll', () => {
    vi.useFakeTimers();
    const onColorPicker = vi.fn();
    renderLightCard({ onColorPicker });

    const shell = screen.getByText('Desk Lamp').closest('[data-light-card-shell]');
    fireEvent.touchStart(shell, { touches: [{ clientX: 40, clientY: 20 }] });
    fireEvent.touchMove(shell, { touches: [{ clientX: 42, clientY: 44 }] });
    act(() => {
      vi.advanceTimersByTime(650);
    });
    fireEvent.touchEnd(shell, { changedTouches: [{ clientX: 42, clientY: 44 }] });

    expect(onColorPicker).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
