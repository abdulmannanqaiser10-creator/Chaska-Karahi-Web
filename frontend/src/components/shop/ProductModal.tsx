'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { ProductBuy } from '@/components/shop/ProductBuy';
import { ProductImage } from '@/components/ProductImage';
import type { Dish } from '@/components/shop/ProductCard';

/**
 * Quick view over the shared buy controls. Sizes and paid add-ons are not offered here
 * beyond the Half/Full switch, because the catalogue has no modifier table — inventing a
 * topping list would sell something the kitchen cannot see.
 */
export function ProductModal({
  dish,
  onClose,
  orderCount,
}: {
  dish: Dish | null;
  onClose: () => void;
  orderCount?: number;
}) {
  useEffect(() => {
    if (!dish) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [dish, onClose]);

  const lead = dish?.[0];

  return (
    <AnimatePresence>
      {dish && lead && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={lead.name}
        >
          <button type="button" aria-label="Close details" className="absolute inset-0 cursor-default bg-charcoal/55" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.99 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-line bg-paper shadow-premium sm:flex-row sm:rounded-3xl"
          >
            <div className="relative aspect-[16/10] w-full shrink-0 bg-surface-2 sm:aspect-auto sm:w-[46%] sm:self-stretch">
              <ProductImage src={lead.imageUrl} alt={lead.name} sizes="(max-width: 640px) 100vw, 420px" />
              <span className="absolute inset-0 bg-gradient-to-t from-charcoal/35 to-transparent" />
              {dish.some((row) => row.isPopular) && (
                <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-charcoal">
                  Bestseller
                </span>
              )}
            </div>

            <ProductBuy dish={dish} orderCount={orderCount} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
