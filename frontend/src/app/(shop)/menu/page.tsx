import { Suspense } from 'react';
import type { Metadata } from 'next';
import { MenuBrowser } from '@/components/shop/MenuBrowser';
import { getOrderCounts, getPublicMenu } from '@/lib/menu';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Menu',
  description:
    'The full Chaska Koyla Karahi menu — chicken, boneless and mutton karahi in Half or Full, the Chaska special and the extras — ordered online for delivery or pickup.',
};

export default async function MenuPage() {
  const [menu, orderCounts] = await Promise.all([getPublicMenu(), getOrderCounts()]);

  return (
    <section className="mx-auto max-w-7xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-5 sm:mb-8">
        <p className="eyebrow">Chaska Koyla Karahi</p>
        <h1 className="mt-2 font-heading text-[clamp(1.85rem,6vw,2.25rem)] font-bold text-heading sm:text-4xl">Our Menu</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Karahi fired to order in its own masala over coal — every one comes in Half or Full. Filter by category or
          search a dish, then add it straight to your cart.
        </p>
      </header>

      <Suspense fallback={<p className="text-sm text-muted">Loading the menu…</p>}>
        <MenuBrowser menu={menu} orderCounts={orderCounts} />
      </Suspense>
    </section>
  );
}
