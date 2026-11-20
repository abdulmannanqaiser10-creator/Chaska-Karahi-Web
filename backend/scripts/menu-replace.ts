/**
 * One-shot live replacement of the whole menu with `backend/db/menu-chaska.ts` — the owner's
 * confirmed 5 categories / 22 dishes (Half + Full) / 11 extras.
 *
 *   npx tsx --env-file=../frontend/.env scripts/menu-replace.ts            # dry run: impact report only
 *   npx tsx --env-file=../frontend/.env scripts/menu-replace.ts --apply    # write it
 *
 * Everything outside the catalogue is deleted, which is safe for history because
 * `order_items.product_id` is ON DELETE SET NULL and each order line already carries its
 * own productName / unitPrice / lineTotal snapshot — receipts, the tables board and the
 * top-products report all read those snapshots, not the product row. `stock_movements`
 * cascades on product delete, so its full contents go into the JSON backup written first.
 *
 * Idempotent by slug: a re-run upserts the same 55 rows and deletes nothing extra. It does
 * overwrite imageUrl from the catalogue, because this is the owner's authoritative import —
 * image edits made in the panel afterwards are safe as long as this script is not re-run.
 * Each --apply rewrites scripts/menu-replace-backup.json, so the second run keeps the menu as
 * it stood after the first and no longer holds the catalogue that was deleted. Copy the file
 * aside before re-running if that earlier snapshot is still needed.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { and, eq, inArray, isNotNull, notInArray, sql } from 'drizzle-orm';
import { db } from '../db';
import { categories, orderItems, products, stockMovements } from '../db/schema';
import { CHASKA_CATEGORIES, CHASKA_MENU_ROWS } from '../db/menu-chaska';

const APPLY = process.argv.includes('--apply');
const KEEP_SLUGS = CHASKA_MENU_ROWS.map((row) => row.slug);
const KEEP_CATEGORY_SLUGS = CHASKA_CATEGORIES.map((row) => row.slug);

async function main() {
  const [allCategories, allProducts, stale, movementRows] = await Promise.all([
    db.select().from(categories),
    db.select({ slug: products.slug }).from(products),
    db
      .select({ id: products.id, slug: products.slug, name: products.name })
      .from(products)
      .where(notInArray(products.slug, KEEP_SLUGS)),
    db.select({ id: stockMovements.id }).from(stockMovements),
  ]);

  const staleIds = stale.map((row) => row.id);
  const [linesOnStale, movementsOnStale] = staleIds.length
    ? await Promise.all([
        db
          .select({ n: sql<number>`count(*)::int` })
          .from(orderItems)
          .where(inArray(orderItems.productId, staleIds))
          .then((rows) => Number(rows[0]?.n ?? 0)),
        db
          .select({ n: sql<number>`count(*)::int` })
          .from(stockMovements)
          .where(inArray(stockMovements.productId, staleIds))
          .then((rows) => Number(rows[0]?.n ?? 0)),
      ])
    : [0, 0];

  console.log(`catalogue : ${CHASKA_CATEGORIES.length} categories, ${CHASKA_MENU_ROWS.length} product rows`);
  console.log(`live now  : ${allCategories.length} categories, ${allProducts.length} products`);
  console.log(`reused    : ${allProducts.filter((p) => KEEP_SLUGS.includes(p.slug)).length} rows already exist at the same slug`);
  console.log(`to delete : ${stale.length} products, ${allCategories.filter((c) => !KEEP_CATEGORY_SLUGS.includes(c.slug)).length} categories`);
  console.log(`impact    : ${linesOnStale} order lines point at products being deleted (their name/price snapshots survive on the line)`);
  console.log(`          : ${movementsOnStale} of ${movementRows.length} stock-movement rows cascade away — all of them are in the backup`);
  if (stale.length > 0) {
    console.log('          : ' + stale.map((row) => `${row.slug} (${row.name})`).join(', '));
  }

  if (!APPLY) {
    console.log('\ndry run — nothing written. Re-run with --apply.');
    return;
  }

  const [categoriesBefore, productsBefore, movementsBefore] = await Promise.all([
    db.select().from(categories),
    db.select().from(products),
    db.select().from(stockMovements),
  ]);
  writeFileSync(
    resolve(import.meta.dirname, 'menu-replace-backup.json'),
    JSON.stringify(
      { takenAt: new Date().toISOString(), keepSlugs: KEEP_SLUGS, categories: categoriesBefore, products: productsBefore, stockMovements: movementsBefore },
      null,
      2,
    ),
  );

  const summary = await db.transaction(async (tx) => {
    const categoryIds = new Map<string, string>();
    let categoriesCreated = 0;
    for (const row of CHASKA_CATEGORIES) {
      const found = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, row.slug))
        .limit(1);
      if (found.length > 0) {
        await tx
          .update(categories)
          .set({ name: row.name, nameUr: row.nameUr, description: row.description, sortOrder: row.sortOrder, isActive: true, updatedAt: new Date() })
          .where(eq(categories.id, found[0].id));
        categoryIds.set(row.slug, found[0].id);
        continue;
      }
      const inserted = await tx
        .insert(categories)
        .values({
          slug: row.slug,
          name: row.name,
          nameUr: row.nameUr,
          description: row.description,
          sortOrder: row.sortOrder,
          isActive: true,
        })
        .returning({ id: categories.id });
      categoryIds.set(row.slug, inserted[0].id);
      categoriesCreated += 1;
    }

    let productsCreated = 0;
    let productsUpdated = 0;
    for (const row of CHASKA_MENU_ROWS) {
      const categoryId = categoryIds.get(row.category);
      if (!categoryId) throw new Error(`missing category ${row.category}`);
      const payload = {
        categoryId,
        name: row.name,
        nameUr: row.nameUr,
        sizeLabel: row.sizeLabel,
        groupKey: row.groupKey,
        description: row.description,
        price: row.price,
        imageUrl: row.image,
        sortOrder: row.sortOrder,
        isAvailable: true,
        updatedAt: new Date(),
      };
      const found = await tx
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, row.slug))
        .limit(1);
      if (found.length > 0) {
        await tx.update(products).set(payload).where(eq(products.id, found[0].id));
        productsUpdated += 1;
        continue;
      }
      await tx.insert(products).values({ slug: row.slug, ...payload });
      productsCreated += 1;
    }

    const droppedProducts = await tx
      .delete(products)
      .where(notInArray(products.slug, KEEP_SLUGS))
      .returning({ id: products.id });
    const droppedCategories = await tx
      .delete(categories)
      .where(notInArray(categories.slug, KEEP_CATEGORY_SLUGS))
      .returning({ id: categories.id });

    const remaining = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(products)
      .where(and(isNotNull(products.id)))
      .then((rows) => Number(rows[0]?.n ?? 0));

    return {
      categoriesCreated,
      productsCreated,
      productsUpdated,
      droppedProducts: droppedProducts.length,
      droppedCategories: droppedCategories.length,
      remaining,
    };
  });

  console.log(
    `[menu-replace] categories +${summary.categoriesCreated}/~${CHASKA_CATEGORIES.length - summary.categoriesCreated}` +
      ` · products +${summary.productsCreated}/~${summary.productsUpdated}` +
      ` · deleted ${summary.droppedProducts} products and ${summary.droppedCategories} categories` +
      ` · products now: ${summary.remaining}`,
  );
  console.log('[menu-replace] previous values saved to scripts/menu-replace-backup.json');
}

void main();
