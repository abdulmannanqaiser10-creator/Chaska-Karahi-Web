'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Crosshair, Loader2, MapPin, Store, Truck, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/Logo';
import { useCart } from '@/components/cart/CartProvider';
import { useShop } from '@/components/shop/ShopProvider';
import { cn } from '@/components/cn';
import { nearestDeliveryArea } from '@/lib/zones';
import { useToast } from '@/components/ui/Toast';

/** Asked once per browser tab: closing the popup is allowed, ordering is not. */
const ASKED_KEY = 'chaska.fulfilment-asked';

type Draft = 'delivery' | 'pickup';
type LocationState = 'idle' | 'locating' | 'matched' | 'unmatched';

/**
 * The opening Delivery / Pick-Up dialog. It answers the two things every order needs before the
 * kitchen can act on it — how the food leaves the shop, and for which area — and nothing can be
 * added to the cart until it is answered. Location matching only ever pre-selects a dropdown the
 * customer still confirms, so a wrong centroid cannot book a delivery nobody asked for.
 */
export function FulfilmentGate() {
  const { isHydrated, choice, canOrder, isGateOpen, closeGate, confirmFulfilment, openGate, mode, area } =
    useCart();
  const shop = useShop();
  const toast = useToast();
  const cardRef = useRef<HTMLDivElement>(null);

  const [draft, setDraft] = useState<Draft>(choice?.mode ?? 'delivery');
  const [city, setCity] = useState('');
  const [areaName, setAreaName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [locationNote, setLocationNote] = useState('');

  const { zones } = shop;
  const areas = zones.find((zone) => zone.city === city)?.areas ?? [];
  const hasTypedArea = zones.length === 0;

  // One city is not a choice worth making the customer click for.
  useEffect(() => {
    if (zones.length === 1) setCity(zones[0].city);
  }, [zones]);

  useEffect(() => {
    if (!isHydrated || choice !== null) return;
    if (window.sessionStorage.getItem(ASKED_KEY) === '1') return;
    window.sessionStorage.setItem(ASKED_KEY, '1');
    openGate();
  }, [isHydrated, choice, openGate]);

  useEffect(() => {
    if (!isGateOpen) return;
    setDraft(choice?.mode ?? mode);
    // Someone who used the header bar before opening this dialog should not have to say it twice.
    if (choice === null && area.trim().length > 0) {
      const name = area.split(',')[0].trim();
      const zone = zones.find((candidate) => candidate.areas.some((entry) => entry.name === name));
      if (zone) {
        setCity(zone.city);
        setAreaName(name);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeGate();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    cardRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isGateOpen, choice, closeGate, mode, area, zones]);

  function pick(mode: Draft) {
    setDraft(mode);
    setError(null);
  }

  function locate() {
    if (!('geolocation' in navigator)) {
      setLocationState('unmatched');
      setLocationNote('This browser will not share a location, so choose your area below.');
      return;
    }
    setLocationState('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = nearestDeliveryArea(zones, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        if (nearest) {
          setCity(nearest.zone.city);
          setAreaName(nearest.area.name);
          setLocationState('matched');
          setLocationNote(`Closest area to you: ${nearest.area.name}`);
          setError(null);
          return;
        }
        setLocationState('unmatched');
        setLocationNote(
          zones.some((zone) => zone.areas.some((area) => area.latitude !== null))
            ? 'You look to be outside our listed areas — pick one below if you are nearby.'
            : 'The area list has no map points to match yet, so choose your area below.',
        );
      },
      (issue) => {
        setLocationState('unmatched');
        setLocationNote(
          issue.code === 1
            ? 'Location permission is off — you can still pick your area below.'
            : 'We could not read your location just now — pick your area below.',
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (draft === 'delivery' && !hasTypedArea && city.length === 0) {
      setError('Choose your city or region.');
      return;
    }
    if (draft === 'delivery' && areaName.trim().length === 0) {
      setError('Choose the area we should deliver to.');
      return;
    }
    const area = areaName.trim();
    confirmFulfilment({ mode: draft, city, area: draft === 'delivery' ? [area, city].filter(Boolean).join(', ') : '' });
    toast(draft === 'delivery' ? `Delivering to ${[area, city].filter(Boolean).join(', ')}` : 'Pickup selected — collect at the counter');
  }

  return (
    <AnimatePresence>
      {isGateOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="fulfilment-title"
        >
          <button type="button" aria-label="Close" className="absolute inset-0 cursor-default bg-charcoal/60" onClick={closeGate} />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.99 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            ref={cardRef}
            tabIndex={-1}
            className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-line bg-paper shadow-premium outline-none sm:rounded-3xl"
          >
            <div className="relative aspect-[16/7] w-full overflow-hidden bg-charcoal">
              {/* A different photo from the hero, loaded eagerly: while the popup is up this band is
                  the largest thing on screen, so it owns the LCP. */}
              <Image
                src="/photos/dumba-shahi-karahi.jpg"
                alt=""
                fill
                priority
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-cover"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/25 to-transparent" />
              <button
                type="button"
                onClick={closeGate}
                aria-label="Close"
                className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-charcoal/45 text-paper transition-colors hover:bg-charcoal/70"
              >
                <X size={18} aria-hidden />
              </button>
              <div className="absolute bottom-3 left-5 right-5">
                <Logo size="sm" withCaption={false} tone="light" href={null} />
                <h2 id="fulfilment-title" className="mt-2 font-heading text-2xl font-bold leading-tight text-paper">
                  How would you like your order?
                </h2>
              </div>
            </div>

            <form onSubmit={submit} className="px-5 pb-5 pt-5 sm:px-6">
              <div role="group" aria-label="Order type" className="grid grid-cols-2 gap-3">
                <ModeTile
                  active={draft === 'delivery'}
                  onClick={() => pick('delivery')}
                  icon={<Truck size={20} aria-hidden />}
                  label="Delivery"
                  caption="Hot at your door"
                />
                <ModeTile
                  active={draft === 'pickup'}
                  onClick={() => pick('pickup')}
                  icon={<Store size={20} aria-hidden />}
                  label="Pick-Up"
                  caption="Collect at the counter"
                />
              </div>

              {draft === 'delivery' && (
                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={locate}
                    disabled={locationState === 'locating'}
                    className="btn btn-outline btn-md w-full"
                  >
                    {locationState === 'locating' ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Crosshair size={16} aria-hidden />}
                    Use Current Location
                  </button>

                  {locationNote.length > 0 && (
                    <p
                      className={cn(
                        'flex items-start gap-1.5 text-xs',
                        locationState === 'matched' ? 'text-success' : 'text-muted',
                      )}
                    >
                      {locationState !== 'matched' && <AlertCircle size={13} className="mt-0.5 shrink-0" aria-hidden />}
                      {locationNote}
                    </p>
                  )}

                  {!hasTypedArea ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <ZoneSelect
                        label="City / Region"
                        value={city}
                        onChange={(next) => {
                          setCity(next);
                          setAreaName('');
                          setError(null);
                        }}
                        placeholder="Select city"
                      >
                        {zones.map((zone) => (
                          <option key={zone.city} value={zone.city}>
                            {zone.city}
                          </option>
                        ))}
                      </ZoneSelect>

                      <ZoneSelect
                        label="Area / Sub Region"
                        value={areaName}
                        onChange={setAreaName}
                        onPick={() => setError(null)}
                        placeholder={city.length > 0 ? 'Select area' : 'Pick a city first'}
                        disabled={areas.length === 0}
                      >
                        {areas.map((area) => (
                          <option key={area.name} value={area.name}>
                            {area.name}
                          </option>
                        ))}
                      </ZoneSelect>
                    </div>
                  ) : (
                    <label className="block">
                      <span className="label">Your area</span>
                      <span className="relative block">
                        <MapPin size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-accent" aria-hidden />
                        <input
                          value={areaName}
                          onChange={(event) => {
                            setAreaName(event.target.value);
                            setError(null);
                          }}
                          maxLength={80}
                          placeholder="Area, city"
                          className="field pl-9"
                        />
                      </span>
                    </label>
                  )}
                </div>
              )}

              {draft === 'pickup' && (
                <p className="mt-5 rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
                  <span className="font-semibold text-heading">Collect from </span>
                  {shop.address.length > 0 ? shop.address : 'the Chaska counter — the address arrives with your order confirmation.'}
                </p>
              )}

              {error && (
                <p role="alert" className="mt-4 flex items-center gap-1.5 text-sm text-danger">
                  <AlertCircle size={15} aria-hidden />
                  {error}
                </p>
              )}

              <button type="submit" className="btn btn-gold btn-lg mt-5 w-full">
                Continue
              </button>
              <button
                type="button"
                onClick={closeGate}
                className="mt-3 w-full text-center text-xs font-semibold text-muted transition-colors hover:text-heading"
              >
                {canOrder ? 'Keep browsing' : 'Browse the menu without choosing'}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModeTile({
  active,
  onClick,
  icon,
  label,
  caption,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  caption: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex flex-col items-start gap-1.5 rounded-2xl border p-4 text-left transition-all duration-200',
        active ? 'border-accent bg-accent/5 shadow-[0_10px_30px_-22px_rgba(16,20,15,0.5)]' : 'border-line bg-surface hover:border-accent/50',
      )}
    >
      <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-full', active ? 'bg-accent text-on-accent' : 'bg-surface-2 text-muted')}>
        {icon}
      </span>
      <span className="font-heading text-base font-semibold text-heading">{label}</span>
      <span className="text-xs leading-snug text-muted">{caption}</span>
    </button>
  );
}

function ZoneSelect({
  label,
  value,
  onChange,
  onPick,
  placeholder,
  disabled = false,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onPick?: () => void;
  placeholder: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
          onPick?.();
        }}
        className="field cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
    </label>
  );
}
