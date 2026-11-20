'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import { ProductImage } from '@/components/ProductImage';
import { cn } from '@/components/cn';
import { formatMoney, toCents } from '@/lib/money';
import { dishHref, isSoldOut, orderLineName, type MenuProduct } from '@/lib/types';

/** One dish: a lone extra, or the Half and Full rows of a karahi. Never empty. */
export type Dish = MenuProduct[];

export function AddToCartButton({
  product,
  className,
  label,
}: {
  product: MenuProduct;
  className?: string;
  /** 'Half' / 'Full' when the card offers a choice, so the button says what it adds. */
  label?: string | null;
}) {
  const { add } = useCart();
  const available = !isSoldOut(product) && toCents(product.price) > 0;
  const name = orderLineName(product);

  return (
    <button
      type="button"
      disabled={!available}
      onClick={() =>
        add({
          productId: product.id,
          slug: product.slug,
          name,
          price: product.price,
          imageUrl: product.imageUrl,
        })
      }
      aria-label={available ? `Add ${name} to cart` : `${name} is unavailable`}
      className={cn('btn-cart', label && 'px-2 text-[0.82rem]', className)}
    >
      {available ? (
        <>
          <ShoppingBag size={16} aria-hidden />
          {label ? `Add ${label}` : 'Add to Cart'}
        </>
      ) : (
        'Sold out'
      )}
    </button>
  );
}

/**
 * The reference dish card: photo, proof line, name, copy, then the price and the action.
 * A karahi is one card with two prices, because Half and Full are two rows of the same
 * dish — the pair is grouped by `groupKey` before it gets here.
 *
 * `orderCount` is a real figure from `order_items`, not a star rating: nothing in this shop
 * is rated, so the card states what actually happened instead of a score nobody gave.
 */
export function ProductCard({
  dish,
  onDetails,
  orderCount,
}: {
  dish: Dish;
  onDetails?: (dish: Dish) => void;
  orderCount?: number;
}) {
  const lead = dish[0];
  const sizes = dish.filter((row) => row.sizeLabel !== null);
  const soldOut = dish.every(isSoldOut);

  return (
    <article className="card card-hover group relative flex h-full min-w-0 flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => onDetails?.(dish)}
        disabled={!onDetails}
        aria-label={onDetails ? `View details for ${lead.name}` : undefined}
        className="relative block w-full min-w-0 text-left disabled:cursor-default"
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden bg-surface-2">
          <ProductImage
            src={lead.imageUrl}
            alt={lead.name}
            className="transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 45vw, 22vw"
          />
        </span>
        <span className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-charcoal/45 to-transparent" />
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-full bg-charcoal/85 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-paper">
            Sold out
          </span>
        ) : (
          dish.some((row) => row.isPopular) && (
            <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-charcoal">
              Bestseller
            </span>
          )
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2 text-xs">
          <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-heading">
            <span aria-hidden className="shrink-0 text-gold-deep">
              ★
            </span>
            {typeof orderCount === 'number' && orderCount > 0 ? (
              <>
                {orderCount.toLocaleString('en-US')} <span className="font-normal text-muted">order{orderCount === 1 ? '' : 's'}</span>
              </>
            ) : (
              <span className="font-normal text-muted">Cooked to order</span>
            )}
          </span>
          <span className="max-w-[45%] shrink-0 truncate text-right text-[0.65rem] font-semibold uppercase tracking-wide text-accent sm:text-[0.68rem]">
            {lead.categoryName}
          </span>
        </div>

        <h3 className="mt-2 break-words text-[0.98rem] font-semibold leading-snug text-heading sm:text-[1.02rem]">
          <Link href={dishHref(lead)} className="transition-colors hover:text-accent">
            {lead.name}
          </Link>
        </h3>
        {lead.nameUr && <p lang="ur" className="urdu mt-0.5 text-[0.9rem] text-gold-deep">{lead.nameUr}</p>}
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-muted">{lead.description}</p>

        {sizes.length > 1 ? (
          <dl className="mt-4 grid grid-cols-2 gap-1.5 sm:gap-2">
            {sizes.map((row) => (
              <div key={row.id} className="min-w-0 rounded-xl border border-line bg-surface-2 px-2.5 py-1.5 sm:px-3">
                <dt className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted">{row.sizeLabel}</dt>
                <dd className="font-heading text-sm font-bold leading-tight text-heading sm:text-base">{formatMoney(row.price)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-4 font-heading text-xl font-bold text-heading">{formatMoney(lead.price)}</p>
        )}

        {sizes.length > 1 ? (
          <div className="mt-3 grid grid-cols-2 gap-1.5 sm:gap-2">
            {sizes.map((row) => (
              <AddToCartButton key={row.id} product={row} label={row.sizeLabel} className="w-full px-1.5 text-[0.75rem] sm:px-2 sm:text-[0.82rem]" />
            ))}
          </div>
        ) : (
          <AddToCartButton product={lead} className="mt-3 w-full" />
        )}
      </div>
    </article>
  );
}
