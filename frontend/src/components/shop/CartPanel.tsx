'use client';

import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/components/cart/CartProvider';
import { ProductImage } from '@/components/ProductImage';
import { cn } from '@/components/cn';
import { formatMoney, fromCents } from '@/lib/money';

/**
 * The cart card from the reference, reused by the home rail, the drawer and /cart.
 * Every figure here is carried through to checkout unchanged and itemised in the
 * WhatsApp order message, so what the customer sees is what the kitchen receives.
 */
export function CartPanel({ onClose, className }: { onClose?: () => void; className?: string }) {
  const { lines, count, subtotalCents, setQuantity, remove, clear, mode, canOrder, openGate } = useCart();

  return (
    <div className={cn('card flex flex-col overflow-hidden', className)}>
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-heading text-lg font-bold text-heading">
            Your Cart {count > 0 && <span className="text-muted">({count})</span>}
          </h2>
          <p className="text-xs text-muted">{count === 0 ? 'Nothing added yet' : `${count} item${count === 1 ? '' : 's'} ready to order`}</p>
        </div>
        <div className="flex items-center gap-1">
          {lines.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="rounded-full px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            >
              Clear All
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close cart"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-heading"
            >
              <X size={18} aria-hidden />
            </button>
          )}
        </div>
      </header>

      {lines.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-14 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted">
            <ShoppingBag size={20} aria-hidden />
          </span>
          <p className="text-sm text-muted">Your cart is empty. Add a dish to get started.</p>
          <Link href="/menu" onClick={onClose} className="btn btn-primary btn-md">
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <ul className="max-h-[60vh] min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {lines.map((line) => (
              <li key={line.productId} className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                  <ProductImage src={line.imageUrl} alt={line.name} sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-heading">{line.name}</p>
                  <p className="text-sm text-accent">{formatMoney(line.price)}</p>
                  {line.notes && (
                    <p className="mt-0.5 truncate text-[0.7rem] text-muted" title={line.notes}>
                      Note: {line.notes}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1">
                    <StepButton label={`Decrease ${line.name}`} onClick={() => setQuantity(line.productId, line.quantity - 1)}>
                      <Minus size={13} aria-hidden />
                    </StepButton>
                    <span className="w-7 text-center text-xs font-semibold tabular-nums text-heading">{line.quantity}</span>
                    <StepButton label={`Increase ${line.name}`} onClick={() => setQuantity(line.productId, line.quantity + 1)}>
                      <Plus size={13} aria-hidden />
                    </StepButton>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(line.productId)}
                  aria-label={`Remove ${line.name}`}
                  className="mt-1 text-muted transition-colors hover:text-danger"
                >
                  <Trash2 size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>

          <footer className="space-y-2.5 border-t border-line bg-paper-2 px-5 py-4">
            <Row label="Subtotal" value={formatMoney(fromCents(subtotalCents))} />
            {mode === 'pickup' && <Row label="Pickup" value="Free" hint="collect at the counter" />}
            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="text-sm font-semibold text-heading">Estimated Total</span>
              <span className="font-heading text-xl font-bold text-accent">{formatMoney(fromCents(subtotalCents))}</span>
            </div>
            {canOrder ? (
              <Link href="/checkout" onClick={onClose} className="btn btn-gold btn-lg mt-1 w-full">
                Proceed to Checkout <ArrowRight size={17} aria-hidden />
              </Link>
            ) : (
              <button type="button" onClick={openGate} className="btn btn-gold btn-lg mt-1 w-full">
                Choose Delivery or Pickup <ArrowRight size={17} aria-hidden />
              </button>
            )}
          </footer>
        </>
      )}
    </div>
  );
}

function StepButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-line bg-surface text-heading transition-colors hover:border-accent hover:text-accent"
    >
      {children}
    </button>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">
        {label}
        {hint && <span className="ml-1 text-xs text-muted/70">({hint})</span>}
      </span>
      <span className="font-medium text-heading">{value}</span>
    </div>
  );
}
