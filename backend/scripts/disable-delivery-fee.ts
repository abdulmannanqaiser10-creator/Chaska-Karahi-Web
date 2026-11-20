/**
 * Forces orders.delivery_fee to 0 so legacy admin settings cannot reintroduce a fee
 * into any path that still reads the raw setting.
 *
 *   npx tsx --env-file=../frontend/.env scripts/disable-delivery-fee.ts
 */
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { appSettings } from '../db/schema';

async function main() {
  const existing = await db.query.appSettings.findFirst({ where: eq(appSettings.key, 'orders.delivery_fee') });
  if (existing) {
    await db.update(appSettings).set({ value: '0', updatedAt: new Date() }).where(eq(appSettings.key, existing.key));
    console.log('[fee] orders.delivery_fee set to 0');
    return;
  }
  await db.insert(appSettings).values({ key: 'orders.delivery_fee', value: '0' });
  console.log('[fee] orders.delivery_fee created as 0');
}

void main();
