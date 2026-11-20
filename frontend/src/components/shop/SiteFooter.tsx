'use client';

import { Clock, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { useShop } from '@/components/shop/ShopProvider';
import { localYear } from '@/lib/time';

const LEGAL_LINKS = [
  { href: '/cart', label: 'Your cart' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/terms', label: 'Terms of sale' },
];

export function SiteFooter() {
  const shop = useShop();
  const hasContact = Boolean(shop.phone || shop.address || shop.hours);

  return (
    <footer className="mt-10 bg-coal text-paper/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo href="/" size="md" tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/60">
            {shop.tagline}. Cooked to order and ready for delivery, pickup or a table at the counter.
          </p>
          {shop.socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2.5">
              {shop.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.label}
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-paper/75 transition-colors hover:border-gold hover:text-gold"
                  >
                    <SocialIcon label={social.label} />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Contact</h2>
          {hasContact ? (
            <ul className="mt-4 space-y-3 text-sm">
              {shop.address && (
                <li className="flex gap-2.5">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-paper/45" aria-hidden />
                  <span className="whitespace-pre-line">{shop.address}</span>
                </li>
              )}
              {shop.phone && (
                <li className="flex gap-2.5">
                  <Phone size={16} className="mt-0.5 shrink-0 text-paper/45" aria-hidden />
                  <a href={`tel:${shop.phone}`} className="hover:text-paper">
                    {shop.phone}
                  </a>
                </li>
              )}
              {shop.hours && (
                <li className="flex gap-2.5">
                  <Clock size={16} className="mt-0.5 shrink-0 text-paper/45" aria-hidden />
                  <span className="whitespace-pre-line">{shop.hours}</span>
                </li>
              )}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-paper/55">Visit us for dine-in, pickup or delivery across our service areas.</p>
          )}
        </div>

        <nav aria-label="Legal">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Legal</h2>
          <ul className="mt-4 space-y-1 text-sm">
            {LEGAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-10 items-center transition-colors hover:text-paper">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            &copy; {localYear()} {shop.name}. All rights reserved.
          </p>
          <p>
            Powered By{' '}
            <a
              href="https://lexcoresolutions.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="font-semibold text-gold transition-colors hover:text-paper"
            >
              LexcoreSolution
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ label }: { label: string }) {
  const name = label.toLowerCase();

  if (name.includes('instagram')) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (name.includes('facebook')) {
    return (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.5c0-.8.2-1.4 1.4-1.4h1.5V5.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v1.9H8.2V14h2.3v7h3z" />
      </svg>
    );
  }

  if (name.includes('x') || name.includes('twitter')) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.5 3h3l-6.6 7.6L21.8 21h-6l-4.7-6.1L5.6 21h-3l7.1-8.1L2.5 3h6.2l4.2 5.6L17.5 3zm-.9 16.2h1.7L7.6 4.7H5.8l10.8 14.5z" />
      </svg>
    );
  }

  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8M12 8v8" />
    </svg>
  );
}
