import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { HomeAssistantProvider, useHomeAssistant } from './HomeAssistantContext';

const connectionMock = vi.hoisted(() => ({
  instances: [],
  disconnects: 0,
  setHAConnection: vi.fn(),
}));

vi.mock('../services/haClient', () => ({
  default: {
    setHAConnection: connectionMock.setHAConnection,
  },
}));

vi.mock('@hakit/core', () => ({
  computeDomain: (entityId) => entityId.split('.')[0],
  computeObjectId: (entityId) => entityId.split('.').slice(1).join('.'),
  computeStateName: (entity) => entity.attributes.friendly_name || entity.entity_id,
  getCssColorValue: () => null,
  isUnavailableState: (state) => state === 'unavailable' || state === 'unknown',
  lightSupportsBrightness: () => false,
  lightSupportsColor: () => false,
  stateActive: (entity) => entity.state === 'on',
}));

vi.mock('../services/HAConnection', () => ({
  default: class MockHAConnection {
    constructor(url, token, onStateChange, onConnect, onDisconnect, onStage) {
      this.url = url;
      this.token = token;
      this.onStateChange = onStateChange;
      this.onConnect = onConnect;
      this.onDisconnect = onDisconnect;
      this.onStage = onStage;
      this.connected = false;
      this.connecting = false;
      connectionMock.instances.push(this);
    }

    connect() {
      this.connecting = true;
    }

    async disconnect() {
      this.connecting = false;
      this.connected = false;
      connectionMock.disconnects += 1;
    }

    async emitConnected() {
      this.connecting = false;
      this.connected = true;
      await this.onConnect();
    }

    emitStates(states) {
      this.onStateChange(states);
    }

    emitStage(stage) {
      this.onStage(stage);
    }
  },
}));

const renderProvider = () => {
  const apiRef = { current: null };
  const Consumer = () => {
    const api = useHomeAssistant();
    useLayoutEffect(() => {
      apiRef.current = api;
    }, [api]);
    return null;
  };

  render(
    <HomeAssistantProvider>
      <Consumer />
    </HomeAssistantProvider>
  );

  return () => apiRef.current;
};

describe('HomeAssistantProvider connection stability', () => {
  beforeEach(() => {
    connectionMock.instances.length = 0;
    connectionMock.disconnects = 0;
    connectionMock.setHAConnection.mockClear();
    localStorage.clear();
  });

  it('does not disconnect and recreate an active connection for the same credentials', async () => {
    const getApi = renderProvider();

    await act(async () => {
      await getApi().connect('https://control.example/', 'token');
    });

    expect(connectionMock.instances).toHaveLength(1);

    await act(async () => {
      await getApi().connect('https://control.example', 'token');
    });

    expect(connectionMock.instances).toHaveLength(1);
    expect(connectionMock.disconnects).toBe(0);

    await act(async () => {
      await connectionMock.instances[0].emitConnected();
      await getApi().connect('https://control.example', 'token');
    });

    expect(connectionMock.instances).toHaveLength(1);
    expect(connectionMock.disconnects).toBe(0);
  });

  it('keeps connection helper callbacks stable when entity states update', async () => {
    const getApi = renderProvider();

    await act(async () => {
      await getApi().connect('https://control.example', 'token');
    });

    const firstIsManualDisconnect = getApi().isManualDisconnect;
    const firstSetManualDisconnect = getApi().setManualDisconnect;

    await act(async () => {
      connectionMock.instances[0].emitStates({
        'sensor.kitchen_temperature': {
          entity_id: 'sensor.kitchen_temperature',
          state: '21',
          attributes: {},
        },
      });
    });

    expect(getApi().isManualDisconnect).toBe(firstIsManualDisconnect);
    expect(getApi().setManualDisconnect).toBe(firstSetManualDisconnect);
  });

  it('exposes concrete connection stages for the splash screen', async () => {
    const getApi = renderProvider();

    await act(async () => {
      await getApi().connect('https://control.example', 'token');
    });

    expect(getApi().connectionStage).toMatchObject({
      id: 'preparing',
      message: 'Preparing Control Hub connection',
    });

    await act(async () => {
      connectionMock.instances[0].emitStage({
        id: 'subscribing_entities',
        message: 'Subscribing to entity state stream',
        detail: 'Waiting for the first dashboard snapshot',
        progress: 76,
      });
    });

    expect(getApi().connectionStage).toMatchObject({
      id: 'subscribing_entities',
      progress: 76,
    });
  });
});
