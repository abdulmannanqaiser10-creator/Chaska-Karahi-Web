import { and, asc, eq, gte, isNotNull, ne, sql } from 'drizzle-orm';
import { db } from '@/db';
import { categories, orderItems, orders, products } from '@/db/schema';
import { localDayStart } from './time';
import type { CategoryView, MenuProduct } from './types';

export type { CategoryView, MenuProduct };

export async function getPublicMenu() {
  const [categoryRows, productRows] = await Promise.all([
    db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.sortOrder)),
    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        nameUr: products.nameUr,
        sizeLabel: products.sizeLabel,
        groupKey: products.groupKey,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
        isAvailable: products.isAvailable,
        isPopular: products.isPopular,
        stock: products.stock,
        categoryId: products.categoryId,
        categoryName: categories.name,
        categorySlug: categories.slug,
      })
      .from(products)
      .innerJoin(categories, and(eq(products.categoryId, categories.id), eq(categories.isActive, true)))
      .orderBy(asc(products.sortOrder), asc(products.name)),
  ]);

  return { categories: categoryRows, products: productRows.filter((p) => p.isAvailable) as MenuProduct[] };
}

/**
 * How many online orders each dish appears in, grouped by product. The featured cards use
 * this as social proof in place of a star rating — nothing here is rated, so the card states
 * what actually happened instead of a score nobody gave.
 */
export async function getOrderCounts(days = 120): Promise<Record<string, number>> {
  const since = localDayStart(new Date(Date.now() - days * 86_400_000));

  const rows = await db
    .select({
      productId: orderItems.productId,
      orderCount: sql<number>`count(distinct ${orderItems.orderId})::int`,
    })
    .from(orderItems)
    .innerJoin(
      orders,
      and(
        eq(orderItems.orderId, orders.id),
        sql`${orders.channel} in ('website', 'qr')`,
        ne(orders.status, 'rejected'),
        ne(orders.status, 'cancelled'),
      ),
    )
    .where(and(isNotNull(orderItems.productId), gte(orders.createdAt, since)))
    .groupBy(orderItems.productId);

  const counts: Record<string, number> = {};
  for (const row of rows) {
    if (row.productId) counts[row.productId] = Number(row.orderCount);
  }
  return counts;
}
