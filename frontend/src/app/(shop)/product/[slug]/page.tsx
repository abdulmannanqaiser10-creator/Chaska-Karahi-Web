import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';
import { ProductBuy } from '@/components/shop/ProductBuy';
import { ProductCard, type Dish } from '@/components/shop/ProductCard';
import { ProductImage } from '@/components/ProductImage';
import { getOrderCounts, getPublicMenu } from '@/lib/menu';
import { DEFAULT_CURRENCY } from '@/lib/money';
import { dishHref, groupSizes, sumOrderCounts, type PublicMenu } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * The address of a dish is its group key, so `/product/mutton-shahi-karahi` is the page
 * that Half and Full live on together. A size row's own slug still resolves — the link
 * exists in old shares and in the cart — but it opens the same grouped dish.
 */
function pickDish(menu: PublicMenu, slug: string): Dish | null {
  const wanted = decodeURIComponent(slug).trim().toLowerCase();
  const match = menu.products.find((product) => product.slug === wanted || product.groupKey === wanted);
  if (!match) return null;
  return match.groupKey ? menu.products.filter((product) => product.groupKey === match.groupKey) : [match];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const dish = pickDish(await getPublicMenu(), slug);
  if (!dish) return { title: 'Dish not found' };
  const lead = dish[0];
  return {
    title: lead.name,
    description: lead.description || `${lead.name} at Chaska Koyla Karahi — order it online for delivery or pickup.`,
    alternates: { canonical: dishHref(lead) },
  };
}

/** One Offer per price point; a karahi is an AggregateOffer because Half and Full are both buyable. */
function dishJsonLd(dish: Dish) {
  const lead = dish[0];
  const offers = dish.map((row) => ({
    '@type': 'Offer',
    name: row.sizeLabel ? `${row.name} (${row.sizeLabel})` : row.name,
    price: row.price,
    priceCurrency: DEFAULT_CURRENCY,
    availability: row.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
  }));
  const prices = dish.map((row) => Number(row.price)).filter(Number.isFinite);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: lead.name,
    description: lead.description,
    image: lead.imageUrl,
    offers:
      dish.length > 1
        ? {
            '@type': 'AggregateOffer',
            offerCount: dish.length,
            lowPrice: Math.min(...prices).toFixed(2),
            highPrice: Math.max(...prices).toFixed(2),
            priceCurrency: DEFAULT_CURRENCY,
            offers,
          }
        : offers[0],
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [menu, orderCounts] = await Promise.all([getPublicMenu(), getOrderCounts()]);
  const dish = pickDish(menu, slug);
  if (!dish) notFound();

  const lead = dish[0];
  const related = groupSizes(
    menu.products.filter((row) => row.categorySlug === lead.categorySlug && row.groupKey !== lead.groupKey),
  ).slice(0, 4);

  const jsonLd = dishJsonLd(dish);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <ChevronRight size={14} aria-hidden />
        <Link href="/menu" className="hover:text-accent">
          Menu
        </Link>
        <ChevronRight size={14} aria-hidden />
        <Link href={`/menu?c=${lead.categorySlug}`} className="hover:text-accent">
          {lead.categoryName}
        </Link>
        <ChevronRight size={14} aria-hidden />
        <span className="font-medium text-heading">{lead.name}</span>
      </nav>

      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-line bg-surface-2">
          <ProductImage src={lead.imageUrl} alt={lead.name} priority sizes="(max-width: 1024px) 100vw, 52vw" />
          {dish.some((row) => row.isPopular) && (
            <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-charcoal">
              Bestseller
            </span>
          )}
        </div>

        <div className="card overflow-hidden p-0">
          <ProductBuy dish={dish} orderCount={sumOrderCounts(dish, orderCounts)} asHeading="h1" />
        </div>
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-heading text-2xl font-bold text-heading">More from {lead.categoryName}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((row) => (
              <ProductCard key={row[0].id} dish={row} orderCount={sumOrderCounts(row, orderCounts)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
