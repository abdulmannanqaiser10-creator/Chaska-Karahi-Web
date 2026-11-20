import { eq } from 'drizzle-orm';
import { db } from '../db';
import { appSettings } from '../db/schema';
import { DELIVERY_ZONES_PLACEHOLDER } from '../db/delivery-zones';

/**
 * Writes `shop.delivery_zones` for the Delivery / Pick-Up popup.
 *
 *   npx tsx --env-file=../frontend/.env scripts/delivery-zones.ts            # insert only when blank
 *   npx tsx --env-file=../frontend/.env scripts/delivery-zones.ts --apply    # overwrite with the catalogue list
 */
const APPLY = process.argv.includes('--apply');

async function main() {
  const existing = await db.query.appSettings.findFirst({ where: eq(appSettings.key, 'shop.delivery_zones') });
  const previous = existing?.value.trim() ?? '';

  if (previous.length > 0 && !APPLY) {
    console.log(`[zones] shop.delivery_zones already set (${previous.length} chars) — left untouched`);
    console.log('[zones] re-run with --apply to overwrite with the current catalogue list');
    return;
  }

  if (existing) {
    await db.update(appSettings).set({ value: DELIVERY_ZONES_PLACEHOLDER, updatedAt: new Date() }).where(eq(appSettings.key, existing.key));
    console.log('[zones] shop.delivery_zones updated with the current delivery area list');
    return;
  }

  await db.insert(appSettings).values({ key: 'shop.delivery_zones', value: DELIVERY_ZONES_PLACEHOLDER });
  console.log('[zones] shop.delivery_zones created with the current delivery area list');
}

void main();