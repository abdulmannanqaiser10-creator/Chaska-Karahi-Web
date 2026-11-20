import { Apple, Play } from 'lucide-react';
import Link from 'next/link';
import { ProductImage } from '@/components/ProductImage';
import { formatMoney } from '@/lib/money';
import type { MenuProduct } from '@/lib/types';

/**
 * The app band. It appears only when at least one store destination is configured in
 * Admin → Settings, because a dead store button is worse than no button.
 */
export function AppPromo({
  brand,
  links,
  products,
}: {
  brand: string;
  links: { ios: string; android: string };
  products: MenuProduct[];
}) {
  if (links.ios.length === 0 && links.android.length === 0) return null;

  return (
    <section aria-labelledby="app-heading" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-accent-soft px-5 py-10 sm:px-10 sm:py-12">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-10">
          <div className="relative z-10 max-w-lg">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-accent">Order on the go</p>
            <h2 id="app-heading" className="mt-3 font-heading text-[clamp(1.75rem,4vw,2.7rem)] font-bold leading-tight text-heading sm:mt-4">
              Get the {brand} App
            </h2>
            <p className="mt-3 text-[0.98rem] leading-relaxed text-muted sm:mt-4">
              Faster reordering, exclusive offers and live tracking of the karahi on its way to you.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 sm:mt-7">
              {links.ios.length > 0 && (
                <StoreButton href={links.ios} icon={<Apple size={20} aria-hidden />} top="Download on the" name="App Store" />
              )}
              {links.android.length > 0 && (
                <StoreButton href={links.android} icon={<Play size={18} aria-hidden />} top="Get it on" name="Google Play" />
              )}
            </div>
          </div>

          <div className="relative flex items-end justify-center gap-4">
            <Phone featured={products[0]} side={products[1]} className="hidden rotate-[-8deg] sm:flex" />
            <Phone featured={products[1]} side={products[2]} className="z-10 w-[10.5rem] scale-105" />
            <Leaf className="absolute -left-4 top-2 h-14 w-14 rotate-[35deg] text-accent/25" />
            <Leaf className="absolute -right-2 bottom-6 h-16 w-16 rotate-[200deg] text-accent/20" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StoreButton({ href, icon, top, name }: { href: string; icon: React.ReactNode; top: string; name: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex items-center gap-3 rounded-2xl bg-charcoal px-5 py-3 text-paper transition-transform duration-200 hover:-translate-y-0.5 hover:bg-coal"
    >
      {icon}
      <span className="text-left leading-tight">
        <span className="block text-[0.62rem] uppercase tracking-wider text-paper/65">{top}</span>
        <span className="block text-sm font-semibold">{name}</span>
      </span>
    </Link>
  );
}

/** Mock ordering screen drawn from real menu data — nothing invented inside the phone. */
function Phone({ featured, side, className = '' }: { featured?: MenuProduct; side?: MenuProduct; className?: string }) {
  if (!featured) return null;
  const rows = [featured, side].filter((product): product is MenuProduct => Boolean(product));

  return (
    <div
      className={`relative w-[9.5rem] overflow-hidden rounded-[1.8rem] border-[6px] border-charcoal bg-paper shadow-premium ${className}`}
    >
      <div className="flex items-center justify-between bg-charcoal px-3 py-1.5 text-[0.5rem] font-semibold text-paper/80">
        <span>9:41</span>
        <span className="h-1.5 w-8 rounded-full bg-paper/25" />
      </div>
      <div className="p-3">
        <p className="font-heading text-[0.78rem] font-bold leading-tight text-heading">
          Karahi on coal.
          <br />
          <span className="text-gold-deep">Flavour you can taste.</span>
        </p>
        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-surface-2 px-2 py-1 text-[0.52rem] text-muted">
          <SearchGlyph />
          Search for dishes…
        </div>
        <div className="mt-3 space-y-2">
          {rows.map((product) => (
            <div key={product.id} className="flex items-center gap-2 rounded-xl border border-line p-1.5">
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                <ProductImage src={product.imageUrl} alt="" sizes="36px" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[0.55rem] font-semibold text-heading">{product.name}</span>
                <span className="block text-[0.55rem] font-bold text-accent">{formatMoney(product.price)}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-lg bg-accent py-1.5 text-center text-[0.55rem] font-semibold text-on-accent">Add to cart</p>
      </div>
    </div>
  );
}

function SearchGlyph() {
  return (
    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="currentColor" className={className} aria-hidden>
      <path d="M56 6c0 26-14 42-34 42-4 0-8-1-12-3C12 24 26 10 44 8c5-1 9-2 12-2Z" />
    </svg>
  );
}
