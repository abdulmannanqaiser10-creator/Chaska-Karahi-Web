'use client';

import { createContext, useContext } from 'react';
import type { Promo } from '@/lib/promo';
import type { DeliveryZone, Testimonial } from '@/lib/types';

export type { Testimonial };

export type ShopInfo = {
  name: string;
  tagline: string;
  paymentMethods: string[];
  phone: string;
  email: string;
  address: string;
  hours: string;
  socials: { label: string; url: string }[];
  /** The one welcome promotion, or null when the admin has turned it off. */
  promo: Promo | null;
  /** Areas offered for delivery; empty means the shop has not configured any. */
  areas: string[];
  /** Cities with their areas, for the opening Delivery / Pick-Up popup. */
  zones: DeliveryZone[];
  testimonials: Testimonial[];
  appLinks: { ios: string; android: string };
  newsletterUrl: string;
};

const ShopContext = createContext<ShopInfo | null>(null);

export function ShopProvider({ value, children }: { value: ShopInfo; children: React.ReactNode }) {
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopInfo {
  const context = useContext(ShopContext);
  if (!context) throw new Error('useShop must be used inside ShopProvider');
  return context;
}
