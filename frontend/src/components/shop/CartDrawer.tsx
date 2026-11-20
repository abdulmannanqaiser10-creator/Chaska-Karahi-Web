'use client';

import { useEffect } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { CartPanel } from '@/components/shop/CartPanel';
import { cn } from '@/components/cn';

/** Drawer shell for the layouts where the cart has no permanent panel. */
export function CartDrawer() {
  const { isOpen, close } = useCart();

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    if (isOpen) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  return (
    <div className={cn('fixed inset-0 z-[65]', isOpen ? 'pointer-events-auto' : 'pointer-events-none')} aria-hidden={!isOpen}>
      <div
        onClick={close}
        className={cn(
          'absolute inset-0 bg-charcoal/45 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0',
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={cn(
          'absolute right-0 top-0 flex h-[100dvh] w-full max-w-md flex-col bg-paper shadow-2xl transition-transform duration-250',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <CartPanel onClose={close} className="flex-1 rounded-none border-0" />
      </aside>
    </div>
  );
}
