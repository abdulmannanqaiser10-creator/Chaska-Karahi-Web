export type CategoryView = {
  id: string;
  slug: string;
  name: string;
  /** Urdu heading shown beside the English one; NULL = English only. */
  nameUr: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type MenuProduct = {
  id: string;
  slug: string;
  name: string;
  nameUr: string | null;
  /** 'Half' | 'Full' for a karahi; NULL on a single-price item such as an extra. */
  sizeLabel: string | null;
  /** Shared key across the size rows of one dish; NULL means the row stands alone. */
  groupKey: string | null;
  description: string;
  price: string;
  imageUrl: string;
  isAvailable: boolean;
  isPopular: boolean;
  /** NULL means the product is not stock-tracked. */
  stock: number | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
};

/**
 * Two independent switches can stop a sale: the availability toggle and tracked
 * stock. The server re-checks both, so this only decides what the UI offers.
 */
export function isSoldOut(product: Pick<MenuProduct, 'isAvailable' | 'stock'>): boolean {
  return !product.isAvailable || product.stock === 0;
}

export type PublicMenu = { categories: CategoryView[]; products: MenuProduct[] };

/**
 * Half and Full are two rows of one dish, so every menu surface groups by `groupKey`
 * before it renders a card. A standalone extra comes back as a one-row group; the first
 * row of a group fixes its position, so the queries' sortOrder still drives the layout.
 */
export function groupSizes<T extends { groupKey: string | null }>(rows: T[]): T[][] {
  const buckets = new Map<string, T[]>();
  const groups: T[][] = [];
  for (const row of rows) {
    if (row.groupKey === null) {
      groups.push([row]);
      continue;
    }
    const existing = buckets.get(row.groupKey);
    if (existing) {
      existing.push(row);
      continue;
    }
    const created: T[] = [row];
    buckets.set(row.groupKey, created);
    groups.push(created);
  }
  return groups;
}

/**
 * Orders are counted per size row, so a dish's proof line needs its group summed.
 */
export function sumOrderCounts(rows: { id: string }[], orderCounts: Record<string, number>): number {
  let total = 0;
  for (const row of rows) total += orderCounts[row.id] ?? 0;
  return total;
}

/**
 * The size belongs in the snapshot text: a kitchen ticket that says "Chicken White Karahi"
 * without Half or Full cannot be cooked, and the line is never re-joined to the product.
 */
export function orderLineName(product: { name: string; sizeLabel: string | null }): string {
  return product.sizeLabel ? `${product.name} (${product.sizeLabel})` : product.name;
}

/**
 * The address of a dish rather than of one of its sizes: Half and Full share a group key,
 * so the product page opens on the dish and the size is chosen there.
 */
export function dishHref(dish: { slug: string; groupKey: string | null }): string {
  return `/product/${dish.groupKey ?? dish.slug}`;
}

export type Testimonial = { name: string; location: string; quote: string };

/** One place the shop delivers to inside a city. `latitude`/`longitude` are only filled in when */
/** the owner's list carries a `~lat:lng` suffix, which is what "Use Current Location" matches on. */
export type DeliveryArea = { name: string; latitude: number | null; longitude: number | null };

export type DeliveryZone = { city: string; areas: DeliveryArea[] };
