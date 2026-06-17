import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ColorPickerModal from './ColorPickerModal';
import { AccentColorProvider } from '../context/AccentColorContext';

const pickerMocks = vi.hoisted(() => ({
  callService: vi.fn(() => Promise.resolve()),
  entity: {
    isActive: true,
    isMock: false,
    attributes: {
      hs_color: [210, 55],
      brightness: 128,
      effect: 'Constant',
      effect_list: ['Constant', 'Circle', 'Breath'],
    },
    displayName: 'Desk Lamp',
  },
}));

vi.mock('../context/HomeAssistantContext', () => ({
  useHomeAssistant: () => ({
    callService: pickerMocks.callService,
  }),
  useHassEntity: () => pickerMocks.entity,
}));

const renderPicker = () => render(
  <AccentColorProvider>
    <ColorPickerModal
      isOpen
      entityId="light.desk_lamp"
      onClose={vi.fn()}
    />
  </AccentColorProvider>
);

describe('ColorPickerModal', () => {
  beforeEach(() => {
    pickerMocks.callService.mockClear();
  });

  it('updates hue and saturation from the circular color wheel', async () => {
    renderPicker();

    const wheel = screen.getByLabelText('Hue and saturation wheel');
    wheel.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    fireEvent.pointerDown(wheel, { pointerId: 1, clientX: 200, clientY: 100 });
    fireEvent.pointerMove(wheel, { pointerId: 1, clientX: 100, clientY: 0 });
    fireEvent.pointerUp(wheel, { pointerId: 1, clientX: 100, clientY: 0 });

    await waitFor(() => {
      expect(pickerMocks.callService).toHaveBeenCalledWith('light', 'turn_on', {
        entity_id: 'light.desk_lamp',
        hs_color: [270, 100],
        brightness: 128,
      });
    });
  });

  it('sends brightness changes with the current light color', async () => {
    renderPicker();

    const brightness = screen.getByLabelText('Light brightness');
    fireEvent.input(brightness, { target: { value: '204' } });

    await waitFor(() => {
      expect(pickerMocks.callService).toHaveBeenCalledWith('light', 'turn_on', {
        entity_id: 'light.desk_lamp',
        hs_color: [210, 55],
        brightness: 204,
      });
    });
  });

  it('shows light effects and applies the selected effect', async () => {
    renderPicker();

    expect(screen.getByText('Effect')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Set light effect Breath'));

    await waitFor(() => {
      expect(pickerMocks.callService).toHaveBeenCalledWith('light', 'turn_on', {
        entity_id: 'light.desk_lamp',
        effect: 'Breath',
      });
    });
  });
});
