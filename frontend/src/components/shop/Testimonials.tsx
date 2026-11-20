'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/components/cn';
import type { Testimonial } from '@/lib/types';

const STARS = ['★', '★', '★', '★', '★'];

/**
 * Reviews are owner-supplied (Admin → Settings → Customer quotes). With the setting
 * empty the section is not rendered, so the site never shows invented testimonials.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const [perPage, setPerPage] = useState(1);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const apply = () => setPerPage(wide.matches ? 3 : 1);
    apply();
    wide.addEventListener('change', apply);
    return () => wide.removeEventListener('change', apply);
  }, []);

  const pages = useMemo(() => {
    const chunks: Testimonial[][] = [];
    for (let index = 0; index < items.length; index += perPage) chunks.push(items.slice(index, index + perPage));
    return chunks.length > 0 ? chunks : [[]];
  }, [items, perPage]);

  useEffect(() => {
    if (page > pages.length - 1) setPage(0);
  }, [page, pages.length]);

  if (items.length === 0) return null;

  const move = (direction: -1 | 1) => setPage((current) => (current + direction + pages.length) % pages.length);

  return (
    <section aria-labelledby="reviews-heading" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">Happy customers</p>
          <h2 id="reviews-heading" className="mt-2 font-heading text-[clamp(1.75rem,3.6vw,2.6rem)] font-bold text-heading sm:mt-3">
            What Our Customers Say
          </h2>
          <p className="mt-2 text-sm text-muted">Real feedback from people who ate with us.</p>
        </div>
        {pages.length > 1 && (
          <div className="flex gap-2">
            <NavButton label="Previous reviews" onClick={() => move(-1)}>
              <ChevronLeft size={17} aria-hidden />
            </NavButton>
            <NavButton label="Next reviews" onClick={() => move(1)}>
              <ChevronRight size={17} aria-hidden />
            </NavButton>
          </div>
        )}
      </div>

      <div className="mt-6 overflow-hidden sm:mt-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={page}
            initial={{ opacity: 0, x: 26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -26 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-5 lg:grid-cols-3"
          >
            {pages[page].map((review) => (
              <li key={`${review.name}-${review.quote.slice(0, 12)}`} className="card flex flex-col p-6">
                <span className="text-sm tracking-[0.2em] text-gold-deep" aria-label="Rated 5 out of 5">
                  {STARS.join(' ')}
                </span>
                <blockquote className="mt-4 flex-1 text-[0.95rem] leading-relaxed text-muted">“{review.quote}”</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-line pt-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-sm font-bold text-accent-deep">
                    {initials(review.name)}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-heading">{review.name}</span>
                    {review.location.length > 0 && <span className="block text-xs text-muted">{review.location}</span>}
                  </span>
                </figcaption>
              </li>
            ))}
          </motion.ul>
        </AnimatePresence>
      </div>

      {pages.length > 1 && (
        <div className="mt-7 flex justify-center gap-2">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to reviews page ${index + 1}`}
              aria-current={index === page ? 'true' : undefined}
              onClick={() => setPage(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === page ? 'w-7 bg-accent' : 'w-2 bg-line-strong hover:bg-accent/40',
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-heading transition-colors hover:border-accent hover:bg-accent hover:text-on-accent"
    >
      {children}
    </button>
  );
}
