const EARTH_RADIUS_METERS = 6371000;

export const toCoordinateNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const hasCoordinatePair = (point) => (
  toCoordinateNumber(point?.lat) !== null && toCoordinateNumber(point?.lon) !== null
);

export const normalizePoint = (point) => {
  const lat = toCoordinateNumber(point?.lat);
  const lon = toCoordinateNumber(point?.lon);
  if (lat === null || lon === null) return null;
  return { ...point, lat, lon };
};

export const getHaversineDistanceMeters = (from, to) => {
  const start = normalizePoint(from);
  const end = normalizePoint(to);
  if (!start || !end) return null;

  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLon = toRadians(end.lon - start.lon);
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);

  const angle = (
    Math.sin(deltaLat / 2) ** 2
    + Math.cos(startLat) * Math.cos(endLat) * Math.sin(deltaLon / 2) ** 2
  );

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(angle), Math.sqrt(1 - angle));
};

export const buildLocationBoundsPoints = ({ markers = [], homePoint = null, routeCoords = [] } = {}) => {
  const points = [];
  const seen = new Set();

  const addPoint = (point) => {
    const normalized = normalizePoint(point);
    if (!normalized) return;

    const key = `${normalized.lat.toFixed(6)},${normalized.lon.toFixed(6)}`;
    if (seen.has(key)) return;
    seen.add(key);
    points.push(normalized);
  };

  markers.forEach(addPoint);
  addPoint(homePoint);
  routeCoords.forEach((coord) => {
    if (Array.isArray(coord)) {
      addPoint({ lat: coord[0], lon: coord[1] });
      return;
    }
    addPoint(coord);
  });

  return points;
};
