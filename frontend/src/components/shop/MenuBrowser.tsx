'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { ProductCard, type Dish } from '@/components/shop/ProductCard';
import { ProductModal } from '@/components/shop/ProductModal';
import { cn } from '@/components/cn';
import { groupSizes, sumOrderCounts, type PublicMenu } from '@/lib/types';

/**
 * The search and the tab counts both work on dishes, not price rows — a karahi is one
 * result even though Half and Full are two products underneath it.
 *
 * Menu cards are rendered without scroll-reveal wrappers on purpose: hiding the grid
 * behind IntersectionObserver left a blank white band under the category rail on phones.
 */
export function MenuBrowser({ menu, orderCounts }: { menu: PublicMenu; orderCounts: Record<string, number> }) {
  const searchParams = useSearchParams();
  const { setArea } = useCart();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const requested = searchParams.get('c');
  const [category, setCategory] = useState(
    requested && menu.categories.some((row) => row.slug === requested) ? requested : 'all',
  );
  const [details, setDetails] = useState<Dish | null>(null);

  // The hero's area picker arrives as a query param; remember it for checkout.
  useEffect(() => {
    const area = searchParams.get('area');
    if (area) setArea(area);
  }, [searchParams, setArea]);

  // Keep the active category in sync when the URL changes (category rail deep-links).
  useEffect(() => {
    const next = searchParams.get('c');
    if (next && menu.categories.some((row) => row.slug === next)) setCategory(next);
    const nextQuery = searchParams.get('q');
    if (nextQuery !== null) setQuery(nextQuery);
  }, [searchParams, menu.categories]);

  const dishes = useMemo(() => groupSizes(menu.products), [menu.products]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return dishes.filter((dish) => {
      const matchesCategory = category === 'all' || dish[0].categorySlug === category;
      const matchesTerm =
        term.length === 0 ||
        dish.some(
          (row) =>
            row.name.toLowerCase().includes(term) ||
            row.description.toLowerCase().includes(term) ||
            (row.nameUr ?? '').includes(term) ||
            row.categoryName.toLowerCase().includes(term),
        );
      return matchesCategory && matchesTerm;
    });
  }, [dishes, query, category]);

  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const dish of dishes) {
      const slug = dish[0].categorySlug;
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    return [
      { slug: 'all', name: 'All dishes', nameUr: null, count: dishes.length },
      ...menu.categories.map((categoryRow) => ({
        slug: categoryRow.slug,
        name: categoryRow.name,
        nameUr: categoryRow.nameUr,
        count: counts.get(categoryRow.slug) ?? 0,
      })),
    ];
  }, [dishes, menu.categories]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative sm:w-80">
          <span className="sr-only">Search products</span>
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the menu…"
            className="field pl-10"
          />
        </label>

        <p className="text-sm text-muted" aria-live="polite">
          {filtered.length === 0
            ? 'No dishes match that search.'
            : `Showing ${filtered.length} of ${dishes.length} dishes`}
        </p>
      </div>

      {/* The rail stays under the fixed bar so the categories remain reachable while a long
          karahi list scrolls; below `sm` it slides sideways instead of wrapping into a wall. */}
      <nav
        id="categories"
        aria-label="Menu categories"
        className="no-scrollbar -mx-4 mt-5 sticky top-[var(--header-h)] z-20 flex gap-2 overflow-x-auto overscroll-x-contain scroll-mt-[var(--header-h)] border-b border-line/70 bg-paper/95 px-4 py-3 backdrop-blur touch-pan-x sm:-mx-6 sm:px-6"
      >
        {tabs.map((tab) => {
          const active = category === tab.slug;
          return (
            <button
              key={tab.slug}
              type="button"
              onClick={() => {
                setCategory(tab.slug);
                document.getElementById('menu-results')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              }}
              aria-pressed={active}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors sm:min-h-10 sm:px-4',
                active ? 'bg-accent text-on-accent shadow-sm' : 'bg-surface-2 text-heading ring-1 ring-line hover:bg-surface-3',
              )}
            >
              <span className="whitespace-nowrap">{tab.name}</span>
              {tab.nameUr && (
                <span lang="ur" dir="rtl" className={cn('font-urdu whitespace-nowrap text-[0.82rem] leading-none', active ? 'opacity-85' : 'text-gold-deep')}>
                  {tab.nameUr}
                </span>
              )}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[0.68rem] font-bold tabular-nums',
                  active ? 'bg-white/20 text-on-accent' : 'bg-surface-3 text-muted',
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </nav>

      <div id="menu-results" className="min-h-[12rem]">
        {filtered.length === 0 ? (
          <div className="card mt-2 p-10 text-center">
            <p className="text-sm text-muted">Try a different word, or clear the filters.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory('all');
              }}
              className="btn btn-outline btn-md mt-4"
            >
              <X size={15} aria-hidden />
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 min-[380px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((dish) => (
              <div key={dish[0].id} className="min-w-0 h-full">
                <ProductCard dish={dish} orderCount={sumOrderCounts(dish, orderCounts)} onDetails={setDetails} />
              </div>
            ))}
          </div>
        )}
      </div>

      <ProductModal
        dish={details}
        orderCount={details ? sumOrderCounts(details, orderCounts) : undefined}
        onClose={() => setDetails(null)}
      />
    </div>
  );
}
