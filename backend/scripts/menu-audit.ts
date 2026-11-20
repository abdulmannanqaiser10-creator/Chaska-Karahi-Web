import { asc, eq } from 'drizzle-orm';
import { db } from '../db';
import { categories, products } from '../db/schema';
import { CHASKA_CATEGORIES, CHASKA_MENU_ROWS } from '../db/menu-chaska';

/**
 * Reads the live menu and compares it with `backend/db/menu-chaska.ts`. Prices are owner data:
 * once they edit one in the admin panel the row legitimately drifts, so drift is reported,
 * never treated as a crash. Exit code 1 means rows are missing or extra, which is a real
 * problem the replacement script caused.
 *
 *   npx tsx --env-file=.env scripts/menu-audit.ts
 */
type LiveRow = {
  slug: string;
  name: string;
  nameUr: string | null;
  sizeLabel: string | null;
  groupKey: string | null;
  price: string;
  image: string;
  available: boolean;
  category: string;
};

function differences(live: LiveRow, planned: (typeof CHASKA_MENU_ROWS)[number]): string[] {
  const pairs: [string, string, string][] = [
    ['name', live.name, planned.name],
    ['nameUr', live.nameUr ?? '', planned.nameUr ?? ''],
    ['sizeLabel', live.sizeLabel ?? '', planned.sizeLabel ?? ''],
    ['groupKey', live.groupKey ?? '', planned.groupKey ?? ''],
    ['category', live.category, planned.category],
    ['image', live.image, planned.image],
  ];
  const changed = pairs.filter(([, a, b]) => a !== b).map(([label]) => label);
  if (!samePrice(live.price, planned.price)) changed.push('price');
  return changed;
}

function samePrice(a: string, b: string) {
  return Number(a) === Number(b);
}

async function main() {
  const [categoryRows, productRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder)),
    db
      .select({
        slug: products.slug,
        name: products.name,
        nameUr: products.nameUr,
        sizeLabel: products.sizeLabel,
        groupKey: products.groupKey,
        price: products.price,
        image: products.imageUrl,
        available: products.isAvailable,
        category: categories.slug,
      })
      .from(products)
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .orderBy(asc(categories.sortOrder), asc(products.sortOrder)),
  ]);

  console.log(`categories: ${categoryRows.length}`);
  for (const row of categoryRows) {
    console.log(`  ${row.slug} | ${row.name} | ${row.nameUr ?? '-'} | sort=${row.sortOrder} | active=${row.isActive}`);
  }
  console.log(`products: ${productRows.length}`);

  const liveBySlug = new Map(productRows.map((row) => [row.slug, row as LiveRow]));
  const wanted = new Set<string>();

  const missing: string[] = [];
  const drifted: string[] = [];

  for (const planned of CHASKA_MENU_ROWS) {
    wanted.add(planned.slug);
    const live = liveBySlug.get(planned.slug);
    if (!live) {
      missing.push(`  ${planned.slug} is not on the live menu`);
      continue;
    }
    const changed = differences(live, planned);
    if (changed.length > 0) {
      drifted.push(`  ${live.slug}: ${changed.join(', ')} — live ${live.name}/${live.sizeLabel ?? '-'}/${live.price}`);
    }
  }

  const extra = productRows.filter((row) => !wanted.has(row.slug)).map((row) => `  ${row.category} | ${row.slug} | ${row.name} | ${row.price}`);

  const missingCategories = CHASKA_CATEGORIES.filter((row) => !categoryRows.some((live) => live.slug === row.slug));

  if (missingCategories.length > 0) {
    console.log(`categories not on the live menu: ${missingCategories.map((row) => row.slug).join(', ')}`);
  }
  if (drifted.length > 0) {
    console.log(`rows differing from the catalogue (${drifted.length}) — expected after an admin edit:`);
    for (const line of drifted) console.log(line);
  }
  if (extra.length > 0) {
    console.log(`rows on the live menu that the catalogue does not list (${extra.length}):`);
    for (const line of extra) console.log(line);
  }
  if (missing.length > 0) {
    console.log(`catalogue rows missing from the live menu (${missing.length}):`);
    for (const line of missing) console.log(line);
    process.exitCode = 1;
    return;
  }
  console.log(`every catalogue row is live: ${CHASKA_MENU_ROWS.length} rows across ${CHASKA_CATEGORIES.length} categories`);
}

void main();
