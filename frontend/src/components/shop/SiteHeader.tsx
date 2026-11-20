'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, MapPin, Menu, Search, ShoppingBag, Store, Truck, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useCart } from '@/components/cart/CartProvider';
import { useShop } from '@/components/shop/ShopProvider';
import { cn } from '@/components/cn';

/** Only the home page opens with the dark hero behind the bar. */
const OVER_HERO = '/';

/**
 * Ordering toolbar: fulfilment, search, cart and Place Order. Page links live in the
 * footer; the mobile sheet only surfaces Place Order so phones never lose the CTA.
 */
export function SiteHeader() {
  const { count, open, isOpen: cartOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const navId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [term, setTerm] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Route changes always dismiss the panel so a tap on a link never leaves it stuck open.
  useEffect(() => {
    setNavOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (navOpen) {
        setNavOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (searchOpen) setSearchOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navOpen, searchOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = panelRef.current?.querySelector<HTMLElement>('a, button');
    focusable?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

  // Cart drawer and the nav panel must not fight for the same screen.
  useEffect(() => {
    if (cartOpen) setNavOpen(false);
  }, [cartOpen]);

  const floating = pathname === OVER_HERO && !scrolled && !navOpen;

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setSearchOpen(false);
    setNavOpen(false);
    router.push(term.trim() ? `/menu?q=${encodeURIComponent(term.trim())}` : '/menu');
  }

  function toggleNav() {
    setSearchOpen(false);
    setNavOpen((open) => !open);
  }

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300 ease-out',
          floating ? 'bg-transparent' : 'glass border-b border-line shadow-[0_8px_32px_-20px_rgba(16,20,15,0.35)]',
        )}
      >
        <div className="mx-auto flex h-[var(--header-bar-h)] max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
          <Logo
            href="/"
            size="sm"
            tone={floating ? 'light' : 'dark'}
            className={cn(searchOpen ? 'max-sm:hidden' : '', 'min-w-0')}
          />

          <div className="mx-auto hidden min-w-0 max-w-sm flex-1 xl:block">
            <FulfilmentPicker floating={floating} />
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-1 sm:gap-1.5">
            {searchOpen ? (
              <form onSubmit={submitSearch} className="flex min-w-0 items-center gap-1.5" role="search">
                <input
                  autoFocus
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  onBlur={() => term.trim() === '' && setSearchOpen(false)}
                  placeholder="Search the menu"
                  aria-label="Search the menu"
                  className="h-9 w-[min(42vw,11rem)] rounded-full border border-line bg-paper px-3 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 sm:w-52"
                />
                <button type="submit" className="shrink-0 text-sm font-semibold text-accent hover:text-accent-bright">
                  Go
                </button>
              </form>
            ) : (
              <IconButton label="Search the menu" floating={floating} onClick={() => setSearchOpen(true)}>
                <Search size={20} aria-hidden />
              </IconButton>
            )}

            <IconButton label={`Open cart, ${count} item${count === 1 ? '' : 's'}`} floating={floating} onClick={open}>
              <span className="relative">
                <ShoppingBag size={20} aria-hidden />
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-bold text-charcoal">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </span>
            </IconButton>

            <Link
              href="/menu"
              className={cn(
                'btn btn-gold btn-md shine ml-0.5 hidden',
                searchOpen ? 'xl:inline-flex' : 'md:inline-flex',
              )}
            >
              Place Order <ArrowRight size={15} aria-hidden />
            </Link>

            <IconButton
              ref={menuButtonRef}
              label={navOpen ? 'Close navigation menu' : 'Open navigation menu'}
              floating={floating}
              onClick={toggleNav}
              className={cn(
                'relative z-[70] md:hidden',
                !floating && 'bg-surface-2 text-heading ring-1 ring-line',
                floating && 'bg-white/15 text-paper ring-1 ring-white/25',
              )}
              aria-expanded={navOpen}
              aria-controls={navId}
            >
              {navOpen ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
            </IconButton>
          </div>
        </div>

        <div className={cn('border-t px-3 pb-2.5 pt-2 sm:px-4 xl:hidden', floating ? 'border-white/10' : 'border-line/60')}>
          <FulfilmentPicker floating={floating} compact />
        </div>
      </header>

      <MobileNav
        id={navId}
        open={navOpen}
        panelRef={panelRef}
        onClose={() => {
          setNavOpen(false);
          menuButtonRef.current?.focus();
        }}
      />
    </>
  );
}

function MobileNav({
  id,
  open,
  onClose,
  panelRef,
}: {
  id: string;
  open: boolean;
  onClose: () => void;
  panelRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <div
      className={cn('fixed inset-0 z-[60] md:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close navigation menu"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-charcoal/50 transition-opacity duration-250',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      <aside
        id={id}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Order menu"
        className={cn(
          'absolute right-0 top-0 flex h-[100dvh] w-[min(100%,20.5rem)] flex-col border-l border-line bg-paper shadow-premium transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-4">
          <Logo href="/" size="sm" tone="dark" withCaption={false} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-heading"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="flex flex-1 flex-col justify-end gap-3 p-4">
          <Link href="/menu" onClick={onClose} className="btn btn-outline btn-lg w-full">
            Browse Menu
          </Link>
          <Link href="/menu" onClick={onClose} className="btn btn-gold btn-lg w-full">
            Place Order <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
      </aside>
    </div>
  );
}

/**
 * Delivery or pickup, and the area the food is going to. Both are stored with the cart, so checkout
 * starts from what the customer already chose. When the owner has not listed areas the box is typed
 * instead of hidden — a location control that only appears once somebody fills a spreadsheet is a
 * control the customer never sees.
 */
function FulfilmentPicker({ floating, compact = false }: { floating: boolean; compact?: boolean }) {
  const { mode, setMode, area, setArea } = useCart();
  const shop = useShop();

  const field = cn(
    'h-9 w-full min-w-0 truncate rounded-full border pl-8 pr-7 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/40',
    floating ? 'border-white/25 bg-white/12 text-paper' : 'border-line bg-paper text-heading hover:border-accent/50',
  );

  return (
    <div className={cn('flex min-w-0 items-center gap-1.5 sm:gap-2', compact && 'w-full')}>
      <div
        role="group"
        aria-label="How would you like to get this order?"
        className={cn(
          'flex shrink-0 items-center gap-0.5 rounded-full p-1 sm:gap-1',
          floating ? 'bg-white/12 ring-1 ring-white/20' : 'bg-surface-2 ring-1 ring-line',
        )}
      >
        <ModeButton
          active={mode === 'delivery'}
          floating={floating}
          onClick={() => setMode('delivery')}
          icon={<Truck size={14} aria-hidden />}
          label="Delivery"
        />
        <ModeButton
          active={mode === 'pickup'}
          floating={floating}
          onClick={() => setMode('pickup')}
          icon={<Store size={14} aria-hidden />}
          label="Pickup"
        />
      </div>

      {mode === 'delivery' && (
        <label className="relative flex min-w-0 flex-1 items-center">
          <MapPin
            size={15}
            aria-hidden
            className={cn('pointer-events-none absolute left-3 z-[1]', floating ? 'text-gold' : 'text-accent')}
          />
          <span className="sr-only">Delivery area</span>
          {shop.areas.length > 0 ? (
            <select
              value={area}
              onChange={(event) => setArea(event.target.value)}
              className={cn(field, 'cursor-pointer appearance-none')}
            >
              <option value="">Choose your area</option>
              {shop.areas.map((option) => (
                <option key={option} value={option} className="text-ink">
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={area}
              onChange={(event) => setArea(event.target.value)}
              maxLength={80}
              placeholder="Your area"
              className={field}
            />
          )}
        </label>
      )}

      {mode === 'pickup' && shop.address.length > 0 && (
        <p
          title={shop.address}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs font-medium',
            floating ? 'text-paper/85' : 'text-muted',
          )}
        >
          <MapPin size={14} aria-hidden className={cn('shrink-0', floating ? 'text-gold' : 'text-accent')} />
          <span className="truncate">{shop.address}</span>
        </p>
      )}
    </div>
  );
}

function ModeButton({
  active,
  floating,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  floating: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors sm:gap-1.5 sm:px-3',
        active
          ? floating
            ? 'bg-gold text-charcoal'
            : 'bg-accent text-on-accent'
          : floating
            ? 'text-paper/80 hover:text-paper'
            : 'text-muted hover:text-heading',
      )}
    >
      {icon}
      {/* Below 380px the words would squeeze the area field shut, so the icons carry the row. */}
      <span className="max-[380px]:sr-only">{label}</span>
    </button>
  );
}

function IconButton({
  label,
  onClick,
  floating,
  className,
  children,
  ref,
  ...rest
}: {
  label: string;
  onClick: () => void;
  floating: boolean;
  className?: string;
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
}) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95 sm:h-9 sm:w-9',
        floating ? 'text-paper/90 hover:bg-white/12 hover:text-paper' : 'text-muted hover:bg-surface-2 hover:text-accent',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
