import type { DeliveryArea, DeliveryZone } from './types';

/**
 * Delivery zones are stored as editable copy, one city per line or `;` group:
 *
 *     Karachi | DHA Phase 5, Clifton Block 2~24.8160:67.0250
 *
 * The `~lat:lng` suffix is optional — a colon is used instead of a comma so the coordinate
 * survives the comma-separated area list. Only "Use Current Location" reads it.
 */
const AREA_COORDINATE = /^(.+?)\s*~\s*(-?\d+(?:\.\d+)?):(-?\d+(?:\.\d+)?)$/;

function parseArea(entry: string): DeliveryArea | null {
  const match = AREA_COORDINATE.exec(entry);
  if (!match) {
    const name = entry.trim();
    return name.length > 0 ? { name, latitude: null, longitude: null } : null;
  }
  const name = match[1].trim();
  const latitude = Number(match[2]);
  const longitude = Number(match[3]);
  if (name.length === 0 || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { name, latitude, longitude };
}

export function parseDeliveryZones(raw: string): DeliveryZone[] {
  return raw
    .split(/[;\n]/)
    .map((group) => {
      const [city = '', list = ''] = group.split('|');
      return {
        city: city.trim(),
        areas: list
          .split(',')
          .map(parseArea)
          .filter((area): area is DeliveryArea => area !== null)
          .slice(0, 40),
      };
    })
    .filter((zone) => zone.city.length > 0 && zone.areas.length > 0)
    .slice(0, 12);
}

/** Flat area names, so the selectors that only ever asked for an area keep working. */
export function flattenZoneAreas(zones: DeliveryZone[]): string[] {
  return [...new Set(zones.flatMap((zone) => zone.areas.map((area) => area.name)))].slice(0, 24);
}

/**
 * Great-circle distance in km. Good enough to pick the neighbourhood a phone is standing in;
 * it is not a routing distance and is only ever used to pre-select a dropdown.
 */
export function distanceKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(to.latitude - from.latitude);
  const dLon = radians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type NearestArea = { zone: DeliveryZone; area: DeliveryArea; km: number };

/** The closest listed area to the customer's phone, or null when nothing is near enough to claim. */
export function nearestDeliveryArea(
  zones: DeliveryZone[],
  position: { latitude: number; longitude: number },
  maxKm = 15,
): NearestArea | null {
  let best: NearestArea | null = null;
  for (const zone of zones) {
    for (const area of zone.areas) {
      if (area.latitude === null || area.longitude === null) continue;
      const km = distanceKm(position, { latitude: area.latitude, longitude: area.longitude });
      if (km <= maxKm && (best === null || km < best.km)) best = { zone, area, km };
    }
  }
  return best;
}
