'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Leaf, MapPin, Search, ShieldCheck, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';

export type HeroCopy = {
  eyebrow: string;
  line1: string;
  line2: string;
  body: string;
  image: string;
  imageAlt: string;
};

const TRUST = [
  { label: 'Fresh Ingredients', icon: Leaf },
  { label: 'Fast Delivery', icon: Truck },
  { label: 'Trusted Quality', icon: ShieldCheck },
];

/**
 * The dark opening band. Search and area are real: the field goes to the menu filter
 * and the area is remembered for checkout, so the selector is a preference, not a prop.
 */
export function Hero({ copy, areas }: { copy: HeroCopy; areas: string[] }) {
  const router = useRouter();
  const { area, setArea } = useCart();
  const [term, setTerm] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const query = term.trim();
    const params = new URLSearchParams();
    if (query.length > 0) params.set('q', query);
    if (area.length > 0) params.set('area', area);
    router.push(`/menu${params.size > 0 ? `?${params.toString()}` : ''}`);
  }

  return (
    <section aria-labelledby="hero-heading" className="relative -mt-[var(--header-h)] overflow-hidden bg-charcoal">
      <div className="relative mx-auto grid max-w-7xl items-stretch gap-0 px-4 sm:px-6 lg:grid-cols-[minmax(0,46%)_minmax(0,54%)]">
        <div className="relative z-10 flex flex-col justify-center px-1 pb-10 pt-[calc(var(--header-h)+1.5rem)] sm:pb-16 sm:pt-[calc(var(--header-h)+2.5rem)] lg:pb-28">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-gold"
          >
            {copy.eyebrow.split(/[•·|]/).map((part, index) => (
              <span key={part} className="flex items-center gap-3">
                {index > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-paper/40" />}
                {part.trim()}
              </span>
            ))}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            id="hero-heading"
            className="mt-4 font-heading text-[clamp(2.35rem,8vw,4.6rem)] font-bold leading-[1.02] tracking-tight text-balance text-paper sm:mt-5"
          >
            {copy.line1}
            {copy.line2.length > 0 && (
              <>
                <br />
                <span className="text-gold">{copy.line2}</span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-pretty text-paper/75 sm:mt-6 sm:text-[1.02rem]"
          >
            {copy.body}
          </motion.p>

          <form
            onSubmit={submit}
            className="mt-6 flex w-full max-w-xl flex-col gap-2.5 rounded-2xl border border-white/12 bg-white/8 p-2.5 backdrop-blur-sm sm:mt-9 sm:flex-row sm:items-center"
          >
            {areas.length > 0 && (
              <label className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2.5 text-sm sm:w-[11.5rem]">
                <MapPin size={16} className="shrink-0 text-accent" aria-hidden />
                <span className="sr-only">Delivery area</span>
                <select
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  className="w-full cursor-pointer appearance-none bg-transparent text-heading focus:outline-none"
                >
                  <option value="">Select area</option>
                  {areas.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex flex-1 items-center gap-2 px-3 py-2.5">
              <span className="sr-only">Search the menu</span>
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search for a karahi, tikka, naan…"
                className="w-full bg-transparent text-sm text-heading placeholder:text-muted/80 focus:outline-none"
              />
            </label>

            <button
              type="submit"
              aria-label="Search the menu"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent transition-colors hover:bg-accent-bright"
            >
              <Search size={18} aria-hidden />
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap">
            <Link href="/menu" className="btn btn-gold btn-lg shine w-full justify-center sm:w-auto">
              Start Order <ArrowRight size={17} aria-hidden />
            </Link>
            <Link href="/menu#categories" className="btn btn-on-dark btn-lg w-full justify-center sm:w-auto">
              View Menu
            </Link>
          </div>

          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-5 text-xs sm:mt-10 sm:gap-x-8 sm:pt-6 sm:text-sm">
            {TRUST.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-paper/80">
                <Icon size={17} className="text-gold" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* On phones the photo is its own card under the copy; on desktop it is the full-bleed
            right half of the band, which is what the charcoal fade into the text is for. */}
        <div className="relative mb-6 mt-3 min-h-[16.5rem] overflow-hidden rounded-3xl shadow-premium ring-1 ring-white/10 sm:mb-10 sm:mt-4 sm:min-h-[26rem] lg:mb-0 lg:mt-0 lg:min-h-[34rem] lg:rounded-none lg:shadow-none lg:ring-0">
          <Image
            src={copy.image}
            alt={copy.imageAlt}
            fill
            priority
            sizes="(max-width: 1024px) 92vw, 54vw"
            className="object-cover"
          />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-charcoal via-charcoal/35 to-transparent lg:block" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-charcoal/85 to-transparent" />

          <p className="hand absolute right-5 top-5 max-w-[10rem] rotate-[-6deg] text-right text-2xl text-gold/90 sm:text-[1.7rem] lg:right-10 lg:top-16">
            Cooked on coal,
            <br />
            served hot
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
    </section>
  );
}
