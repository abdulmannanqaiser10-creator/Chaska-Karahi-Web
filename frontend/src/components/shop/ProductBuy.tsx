'use client';

import { Minus, Plus, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/components/cn';
import { formatMoney, fromCents, toCents } from '@/lib/money';
import { isSoldOut, orderLineName } from '@/lib/types';
import type { Dish } from '@/components/shop/ProductCard';

/**
 * The buy controls, shared by the quick-view sheet and the product page so the price,
 * the stock cap and the kitchen note behave identically wherever the dish is offered.
 *
 * A dish with two sizes gets a Half/Full switch: they are separate products in the
 * database, so the switch changes which row is being bought rather than adding a modifier.
 */
export function ProductBuy({
  dish,
  onClose,
  orderCount,
  asHeading = 'h2',
}: {
  dish: Dish;
  onClose?: () => void;
  orderCount?: number;
  /** The quick view sits under the page heading; the product page makes the dish the heading. */
  asHeading?: 'h1' | 'h2';
}) {
  const { add, setNotes } = useCart();
  const [sizeKey, setSizeKey] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const sizes = dish.filter((row) => row.sizeLabel !== null);
  const product = sizes.find((row) => row.id === sizeKey) ?? dish[0];

  // Keyed on the rows themselves, not the array: a caller that rebuilds the dish on each
  // render would otherwise clear the size the customer just chose.
  const dishKey = dish.map((row) => row.id).join(',');
  useEffect(() => {
    setSizeKey(null);
    setQuantity(1);
    setNote('');
  }, [dishKey]);

  // Tracked stock caps the stepper; the server re-checks the same rule on submit.
  const max = Math.min(product.stock ?? 30, 30);
  const soldOut = isSoldOut(product);
  const Heading = asHeading;
  const name = orderLineName(product);
  const addLabel = ['Add', String(quantity), product.sizeLabel ?? '', 'to cart'].filter(Boolean).join(' ');

  return (
    <div className="relative flex-1 p-6 sm:p-7">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-heading"
        >
          <X size={18} aria-hidden />
        </button>
      )}

      <p className="eyebrow">{product.categoryName}</p>
      <Heading className="mt-2 font-heading text-[1.7rem] font-bold leading-tight text-heading">{product.name}</Heading>
      {product.nameUr && (
        <p lang="ur" className="urdu mt-1 text-[1.05rem] text-gold-deep">
          {product.nameUr}
        </p>
      )}
      <p className="mt-2 text-sm leading-relaxed text-muted">{product.description}</p>

      {typeof orderCount === 'number' && orderCount > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted">
          <span className="text-gold-deep">★</span> Ordered {orderCount} {orderCount === 1 ? 'time' : 'times'} online
        </p>
      )}

      {sizes.length > 1 && (
        <div className="mt-5">
          <span className="label">Choose your size</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Portion size">
            {sizes.map((row) => {
              const active = row.id === product.id;
              return (
                <button
                  key={row.id}
                  type="button"
                  aria-pressed={active}
                  disabled={isSoldOut(row)}
                  onClick={() => setSizeKey(row.id)}
                  className={cn(
                    'flex-1 rounded-xl border px-4 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    active ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2 hover:border-accent/60',
                  )}
                >
                  <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted">{row.sizeLabel}</span>
                  <span className={cn('block font-heading text-lg font-bold', active ? 'text-accent' : 'text-heading')}>
                    {formatMoney(row.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <span className="flex flex-col leading-none">
          {product.sizeLabel && (
            <span className="mb-1 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-muted">{product.sizeLabel}</span>
          )}
          <span className="font-heading text-2xl font-bold text-accent">{formatMoney(product.price)}</span>
        </span>
        <div className="flex items-center gap-1 rounded-full border border-line bg-surface-2 p-1">
          <StepButton label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
            <Minus size={15} aria-hidden />
          </StepButton>
          <span className="w-9 text-center text-sm font-semibold tabular-nums text-heading">{quantity}</span>
          <StepButton label="Increase quantity" disabled={quantity >= max} onClick={() => setQuantity((value) => Math.min(max, value + 1))}>
            <Plus size={15} aria-hidden />
          </StepButton>
        </div>
      </div>

      {product.stock !== null && !soldOut && <p className="mt-2 text-xs text-muted">{product.stock} left today</p>}

      <div className="mt-5">
        <label htmlFor={`note-${product.id}`} className="label">
          Kitchen note (optional)
        </label>
        <textarea
          id={`note-${product.id}`}
          rows={2}
          value={note}
          maxLength={200}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Less oil, extra ginger, no green chilli…"
          className="field resize-none"
        />
      </div>

      <button
        type="button"
        disabled={soldOut}
        onClick={() => {
          const added = add(
            {
              productId: product.id,
              slug: product.slug,
              name,
              price: product.price,
              imageUrl: product.imageUrl,
            },
            quantity,
          );
          // A blocked add leaves the sheet open: the dish and the note are still there when
          // the customer comes back from the delivery/pickup popup.
          if (!added) return;
          if (note.trim().length > 0) setNotes(product.id, note);
          onClose?.();
        }}
        className="btn-cart mt-6 w-full py-3 text-base"
      >
        {soldOut ? (
          'Sold out for today'
        ) : (
          <>
            <ShoppingBag size={17} aria-hidden />
            {addLabel} · {formatMoney(fromCents(toCents(product.price) * quantity))}
          </>
        )}
      </button>
    </div>
  );
}

function StepButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface text-heading transition-colors hover:bg-accent-soft hover:text-accent disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}
