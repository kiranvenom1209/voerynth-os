import {
  computeDomain,
  computeObjectId,
  computeStateName,
  getCssColorValue,
  isUnavailableState,
  lightSupportsBrightness,
  lightSupportsColor,
  stateActive
} from '@hakit/core';

const fallbackName = (entityId) => {
  const objectId = entityId?.includes('.') ? entityId.split('.').slice(1).join('.') : entityId;
  return (objectId || 'Unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const safeCall = (callback, fallback) => {
  try {
    const value = callback();
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

export const createHassEntityShape = (entityId, entity, mockData = {}) => {
  const attributes = entity?.attributes || mockData.attributes || {};
  const state = entity?.state ?? mockData.state ?? 'unavailable';
  const stateObject = {
    entity_id: entityId,
    state,
    attributes,
    last_changed: entity?.last_changed || entity?.last_updated || mockData.last_changed || new Date().toISOString(),
    last_updated: entity?.last_updated || mockData.last_updated || new Date().toISOString(),
    context: entity?.context || mockData.context || {}
  };

  const domain = safeCall(() => computeDomain(entityId), entityId?.split('.')?.[0] || 'unknown');
  const cssColor = safeCall(() => getCssColorValue(stateObject), null);
  const unavailable = !entity || safeCall(() => isUnavailableState(state), state === 'unavailable' || state === 'unknown');
  const active = !unavailable && safeCall(() => stateActive(stateObject), state === 'on');

  return {
    ...mockData,
    state,
    attributes,
    entity_picture: attributes.entity_picture,
    isUnavailable: unavailable,
    isMock: !entity,
    lastUpdated: new Date(stateObject.last_updated),
    entityId,
    domain,
    objectId: safeCall(() => computeObjectId(entityId), entityId?.split('.')?.slice(1).join('.') || entityId),
    displayName: safeCall(() => computeStateName(stateObject), attributes.friendly_name || fallbackName(entityId)),
    isActive: active,
    color: cssColor,
    supportsBrightness: domain === 'light' ? safeCall(() => lightSupportsBrightness(stateObject), false) : false,
    supportsColor: domain === 'light' ? safeCall(() => lightSupportsColor(stateObject), false) : false,
    raw: entity || stateObject
  };
};
