'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { CartPanel } from '@/components/shop/CartPanel';
import { ProductCard, type Dish } from '@/components/shop/ProductCard';
import { ProductModal } from '@/components/shop/ProductModal';
import { sumOrderCounts } from '@/lib/types';

/**
 * Featured dishes beside the live cart. On narrower screens the cart falls below the
 * grid, and the header's cart icon opens it as a drawer instead.
 */
export function FeaturedSection({ dishes, orderCounts }: { dishes: Dish[]; orderCounts: Record<string, number> }) {
  const [details, setDetails] = useState<Dish | null>(null);

  if (dishes.length === 0) return null;

  return (
    <section aria-labelledby="featured-heading" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14 lg:pb-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Off the coal</p>
          <h2 id="featured-heading" className="mt-2 font-heading text-[clamp(1.75rem,3.6vw,2.6rem)] font-bold text-heading sm:mt-3">
            Featured Dishes
          </h2>
          <p className="mt-2 text-sm text-muted">Every karahi is fired to order — choose Half or Full.</p>
        </div>
        <Link href="/menu" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-bright">
          View All <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      <div className="mt-6 grid gap-5 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        <div className="grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          {dishes.map((dish) => (
            <div key={dish[0].id} className="h-full min-w-0">
              <ProductCard dish={dish} orderCount={sumOrderCounts(dish, orderCounts)} onDetails={setDetails} />
            </div>
          ))}
        </div>

        <CartPanel className="hidden lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:flex lg:self-start" />
      </div>

      <ProductModal dish={details} orderCount={details ? sumOrderCounts(details, orderCounts) : undefined} onClose={() => setDetails(null)} />
    </section>
  );
}
