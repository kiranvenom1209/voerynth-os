export const getElementCenterOrigin = (element) => {
  if (!element || typeof element.getBoundingClientRect !== 'function') return null;

  const rect = element.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;

  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
};

export const getLongPressOriginStyle = (origin) => {
  if (!origin || typeof window === 'undefined') return {};

  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  if (!viewportWidth || !viewportHeight) return {};

  return {
    '--long-press-origin-x': `${Math.round(origin.x - viewportWidth / 2)}px`,
    '--long-press-origin-y': `${Math.round(origin.y - viewportHeight / 2)}px`,
  };
};
