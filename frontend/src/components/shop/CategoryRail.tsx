'use client';

import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { ProductImage } from '@/components/ProductImage';
import { cn } from '@/components/cn';

export type CategoryCard = { slug: string; name: string; nameUr: string | null; subtitle: string; count: number; cover: string };

/**
 * Horizontal rail, as in the reference. The arrows scroll one card at a time and
 * disable themselves at each end, so they are never dead buttons.
 */
export function CategoryRail({ categories }: { categories: CategoryCard[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState<{ start: boolean; end: boolean }>({ start: true, end: false });

  const measure = useCallback(() => {
    const node = track.current;
    if (!node) return;
    const max = node.scrollWidth - node.clientWidth - 1;
    setEdge({ start: node.scrollLeft <= 1, end: node.scrollLeft >= max });
  }, []);

  const step = useCallback(
    (direction: -1 | 1) => {
      const node = track.current;
      if (!node) return;
      const card = node.querySelector('li');
      const width = card ? card.getBoundingClientRect().width + 16 : node.clientWidth * 0.8;
      node.scrollBy({ left: direction * width, behavior: 'smooth' });
    },
    [],
  );

  if (categories.length === 0) return null;

  return (
    <section id="categories" aria-labelledby="categories-heading" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Explore our menu</p>
          <h2 id="categories-heading" className="mt-2 font-heading text-[clamp(1.75rem,3.6vw,2.6rem)] font-bold text-heading sm:mt-3">
            Popular Categories
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/menu" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-bright">
            View All <ArrowRight size={15} aria-hidden />
          </Link>
          <div className="hidden gap-2 sm:flex">
            <RailButton label="Previous categories" disabled={edge.start} onClick={() => step(-1)}>
              <ChevronLeft size={17} aria-hidden />
            </RailButton>
            <RailButton label="Next categories" disabled={edge.end} onClick={() => step(1)}>
              <ChevronRight size={17} aria-hidden />
            </RailButton>
          </div>
        </div>
      </div>

      <ul
        ref={track}
        onScroll={measure}
        className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 touch-pan-x sm:mt-8 sm:gap-4 lg:grid lg:grid-cols-3 lg:overflow-visible"
      >
        {categories.map((category) => (
          <li key={category.slug} className="w-[min(70vw,11.5rem)] shrink-0 snap-start sm:w-[10.5rem] lg:w-auto">
            <Link
              href={`/menu?c=${category.slug}`}
              className="card card-hover group flex h-full flex-col overflow-hidden p-0"
              aria-label={`Browse ${category.name}`}
            >
              <span className="relative block h-24 w-full overflow-hidden bg-surface-2 lg:h-36">
                <ProductImage
                  src={category.cover}
                  alt={category.name}
                  sizes="(max-width: 1024px) 168px, 30vw"
                  className="transition-transform duration-500 group-hover:scale-110"
                />
              </span>
              <span className="flex flex-1 flex-col p-3.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[0.95rem] font-semibold text-heading">{category.name}</span>
                  <ArrowRight size={15} className="shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </span>
                {category.nameUr && (
                  <span lang="ur" dir="rtl" className="mt-1 font-urdu text-[0.9rem] leading-tight text-gold-deep">
                    {category.nameUr}
                  </span>
                )}
                <span className="mt-1 text-xs leading-relaxed text-muted">{category.subtitle}</span>
                <span className="mt-2 text-[0.68rem] font-semibold uppercase tracking-wide text-accent/80">
                  {category.count} {category.count === 1 ? 'dish' : 'dishes'}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RailButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
        disabled
          ? 'cursor-not-allowed border-line text-muted/40'
          : 'border-line bg-surface text-heading hover:border-accent hover:bg-accent hover:text-on-accent',
      )}
    >
      {children}
    </button>
  );
}
