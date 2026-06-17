import { describe, expect, it } from 'vitest';
import {
  buildLocationBoundsPoints,
  getHaversineDistanceMeters,
  normalizePoint,
  toCoordinateNumber,
} from './locationGeometry';

describe('location geometry helpers', () => {
  it('normalizes numeric coordinate strings', () => {
    expect(toCoordinateNumber('50.7212')).toBe(50.7212);
    expect(normalizePoint({ lat: '50.7212', lon: '10.4521' })).toMatchObject({
      lat: 50.7212,
      lon: 10.4521,
    });
  });

  it('calculates direct distance between two coordinates', () => {
    const distance = getHaversineDistanceMeters(
      { lat: 50.7212, lon: 10.4521 },
      { lat: 50.7135, lon: 10.4442 }
    );

    expect(distance).toBeGreaterThan(900);
    expect(distance).toBeLessThan(1100);
  });

  it('builds map bounds from people, home, and route points without duplicates', () => {
    const points = buildLocationBoundsPoints({
      markers: [{ id: 'kiran', lat: 50.7212, lon: 10.4521 }],
      homePoint: { id: 'home', lat: 50.7135, lon: 10.4442 },
      routeCoords: [[50.7212, 10.4521], [50.717, 10.448], [50.7135, 10.4442]],
    });

    expect(points).toHaveLength(3);
    expect(points.map((point) => point.id)).toEqual(['kiran', 'home', undefined]);
  });
});
