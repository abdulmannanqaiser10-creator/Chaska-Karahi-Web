/**
 * Delivery areas for the delivery/pickup popup, in the `City | Area~lat:lng` format read by
 * `parseDeliveryZones()`. Coordinates are approximate centroids so "Use Current Location" can
 * pre-select a nearby area. The owner can still edit this text in Admin → Settings.
 */
const KARACHI_AREAS = [
  'PIB Colony~24.8856:67.0444',
  'Jamshed Road~24.8750:67.0400',
  'Garden East~24.8755:67.0220',
  'Numaish~24.8720:67.0305',
  'Soldier Bazaar~24.8760:67.0350',
  'Nazimabad~24.9150:67.0300',
  'Gulshan-e-Iqbal~24.9050:67.0800',
  'Jali Road~24.8700:67.0250',
  'M.A. Jinnah Road~24.8550:67.0150',
];

export const DELIVERY_ZONES_PLACEHOLDER = `Karachi | ${KARACHI_AREAS.join(', ')}`;