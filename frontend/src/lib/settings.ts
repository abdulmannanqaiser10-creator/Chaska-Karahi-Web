import { db } from '@/db';
import { appSettings } from '@/db/schema';
import type { DeliveryZone, Testimonial } from './types';
import { flattenZoneAreas, parseDeliveryZones } from './zones';

export type Settings = Record<string, string>;

export async function getSettings(): Promise<Settings> {
  const rows = await db.select({ key: appSettings.key, value: appSettings.value }).from(appSettings);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function setting(settings: Settings, key: string, fallback = ''): string {
  const value = settings[key]?.trim();
  return value && value.length > 0 ? value : fallback;
}

/** Delivery fees are disabled site-wide — always zero for cart, checkout and WhatsApp totals. */
export function deliveryFeeCents(settings: Settings): number {
  void settings;
  return 0;
}

export function paymentMethods(settings: Settings): string[] {
  const raw = setting(settings, 'orders.payment_methods', 'Cash on Delivery');
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

/** Areas the shop has said it delivers to. Blank means the selector is not shown. */
export function deliveryAreas(settings: Settings): string[] {
  return setting(settings, 'shop.delivery_areas')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 24);
}

/**
 * Cities with the areas under them, read by the delivery/pickup popup. `shop.delivery_areas`
 * stays the flat list every other surface uses, so the two keys can be filled in any order.
 */
export function deliveryZones(settings: Settings): DeliveryZone[] {
  const zones = parseDeliveryZones(setting(settings, 'shop.delivery_zones'));
  if (zones.length > 0) return zones;
  const areas = deliveryAreas(settings);
  return areas.length > 0 ? [{ city: 'All areas', areas: areas.map((name) => ({ name, latitude: null, longitude: null })) }] : [];
}

/** Every area the shop serves, from either settings key, in the order the owner wrote them. */
export function allDeliveryAreas(settings: Settings): string[] {
  return [...new Set([...deliveryAreas(settings), ...flattenZoneAreas(deliveryZones(settings))])].slice(0, 24);
}

/**
 * Reviews are owner-supplied copy, one per line as `Name | Location | Quote`.
 * Nothing is invented here: with the key empty the section is not rendered at all.
 */
export function testimonials(settings: Settings): Testimonial[] {
  return setting(settings, 'shop.testimonials')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 12)
    .map((line) => {
      // `Name | Location | Quote`, or `Name | Quote` when there is no location.
      const parts = line.split('|').map((part) => part.trim());
      if (parts.length < 2) return null;
      const [name, second, ...rest] = parts;
      return rest.length > 0 ? { name, location: second, quote: rest.join(' | ') } : { name, location: '', quote: second };
    })
    .filter((row): row is Testimonial => row !== null && row.name.length > 0 && row.quote.length > 0);
}

/**
 * The hero heading is stored as one line of copy but shown on two, with the second in
 * gold. A newline is the author's break; otherwise the first sentence ends line one.
 */
export function splitHeading(value: string): [string, string] {
  const explicit = value.split(/\r?\n/);
  if (explicit.length >= 2) return [explicit[0].trim(), explicit.slice(1).join(' ').trim()];

  const boundary = value.search(/[.!?]\s/);
  if (boundary === -1) return [value.trim(), ''];
  return [value.slice(0, boundary + 1).trim(), value.slice(boundary + 1).trim()];
}
