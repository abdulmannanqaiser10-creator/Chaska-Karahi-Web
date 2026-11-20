import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CartPanel } from '@/components/shop/CartPanel';
import { ProductCard } from '@/components/shop/ProductCard';
import { getOrderCounts, getPublicMenu } from '@/lib/menu';
import { groupSizes, sumOrderCounts } from '@/lib/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your cart',
  description: 'Review the dishes in your Chaska Koyla Karahi cart, apply a promo code and check out.',
};

export default async function CartPage() {
  const [menu, orderCounts] = await Promise.all([getPublicMenu(), getOrderCounts()]);

  // The cart itself lives in the browser, so these are the shop's own extras rather than a
  // filtered list. With no Extras category configured the aside simply does not render.
  const suggestions = groupSizes(menu.products)
    .filter((dish) => dish[0].categorySlug === 'extras')
    .slice(0, 4);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <p className="eyebrow">Cart</p>
        <h1 className="mt-2 font-heading text-4xl font-bold text-heading">Your order</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Check the dishes and quantities, add a kitchen note before you leave this page, and head to checkout. Your
          order is sent to the restaurant on WhatsApp, where the kitchen confirms it.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="min-w-0">
          <CartPanel />
          <Link href="/menu" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-accent-bright">
            <ArrowLeft size={15} aria-hidden /> Keep browsing the menu
          </Link>
        </div>

        {suggestions.length > 0 && (
          <aside>
            <h2 className="font-heading text-lg font-bold text-heading">Add to your order</h2>
            <p className="mt-1 text-sm text-muted">Naan, salad, raita and drinks to go with it.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {suggestions.map((dish) => (
                <ProductCard key={dish[0].id} dish={dish} orderCount={sumOrderCounts(dish, orderCounts)} />
              ))}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
