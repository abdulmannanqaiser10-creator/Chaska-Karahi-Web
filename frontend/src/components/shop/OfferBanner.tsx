'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import type { Promo } from '@/lib/promo';

/**
 * The special-offer band. It renders only when a promotion is actually live, because
 * the code it prints is the code the server will honour at checkout.
 */
export function OfferBanner({ promo, image }: { promo: Promo; image: string }) {
  const router = useRouter();
  const { setCoupon } = useCart();

  function claim() {
    setCoupon(promo.code);
    router.push('/menu');
  }

  return (
    <section aria-labelledby="offer-heading" className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-coal">
        <div className="relative grid items-center gap-6 px-7 py-12 sm:px-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,42%)] lg:py-14">
          <div className="relative z-10 max-w-lg">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-gold">Special offer</p>
            <h2 id="offer-heading" className="mt-4 font-heading text-[clamp(2rem,4.6vw,3.1rem)] font-bold leading-[1.08] text-paper">
              Get <span className="text-gold">{promo.percent}% Off</span>
              <br />
              {promo.firstOrderOnly ? 'Your First Order' : 'Your Order'}
            </h2>
            <p className="mt-4 text-sm text-paper/80">
              Use code{' '}
              <span className="rounded-md bg-white/12 px-2 py-0.5 font-mono text-sm font-semibold tracking-wide text-gold">
                {promo.code}
              </span>{' '}
              at checkout.
            </p>
            {promo.body.length > 0 && <p className="mt-2 max-w-md text-sm leading-relaxed text-paper/65">{promo.body}</p>}
            <button type="button" onClick={claim} className="btn btn-gold btn-lg shine mt-8">
              Place Order <ArrowRight size={17} aria-hidden />
            </button>
          </div>

          <div className="relative z-10 min-h-[13rem] lg:min-h-[17rem]">
            <Image src={image} alt="" fill sizes="(max-width: 1024px) 90vw, 40vw" className="rounded-2xl object-cover" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10" />
            <ScallopedBadge percent={promo.percent} />
            <p className="hand absolute -bottom-1 right-2 rotate-[-5deg] text-right text-xl text-paper/85">
              Good food,
              <br />
              good mood
            </p>
          </div>

          <Leaf className="absolute -left-6 top-8 h-24 w-24 text-accent-bright/25" />
          <Leaf className="absolute bottom-4 left-1/3 hidden h-16 w-16 rotate-[210deg] text-gold/25 lg:block" />
          <Leaf className="absolute -right-4 -top-8 h-28 w-28 rotate-[150deg] text-accent-bright/20" />
        </div>
      </div>
    </section>
  );
}

function ScallopedBadge({ percent }: { percent: number }) {
  const points = Array.from({ length: 24 }, (_, index) => {
    const angle = (index / 24) * Math.PI * 2;
    const radius = index % 2 === 0 ? 50 : 44;
    return `${(60 + Math.cos(angle) * radius).toFixed(2)},${(60 + Math.sin(angle) * radius).toFixed(2)}`;
  }).join(' ');

  return (
    <div className="absolute -left-4 -top-5 grid h-[5.5rem] w-[5.5rem] place-items-center sm:h-24 sm:w-24">
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full drop-shadow-[0_10px_22px_rgba(235,165,45,0.45)]" aria-hidden>
        <polygon points={points} fill="#FFBD45" />
      </svg>
      <span className="relative text-center leading-none text-charcoal">
        <span className="block font-heading text-2xl font-bold">{percent}%</span>
        <span className="block text-[0.62rem] font-bold uppercase tracking-[0.18em]">off</span>
      </span>
    </div>
  );
}

function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden>
      <path d="M56 6c0 26-14 42-34 42-4 0-8-1-12-3C12 24 26 10 44 8c5-1 9-2 12-2Z" opacity="0.9" />
      <path d="M10 58c8-16 20-26 34-32" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
