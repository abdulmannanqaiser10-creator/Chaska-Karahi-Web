import { CartProvider } from '@/components/cart/CartProvider';
import { CartDrawer } from '@/components/shop/CartDrawer';
import { FulfilmentGate } from '@/components/shop/FulfilmentGate';
import { SiteFooter } from '@/components/shop/SiteFooter';
import { SiteHeader } from '@/components/shop/SiteHeader';
import { ShopProvider, type ShopInfo } from '@/components/shop/ShopProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { allDeliveryAreas, deliveryZones, getSettings, paymentMethods, setting, testimonials } from '@/lib/settings';
import { parsePromo } from '@/lib/promo';

export const dynamic = 'force-dynamic';

async function shopInfo(): Promise<ShopInfo> {
  const settings = await getSettings();
  const socials = [
    { label: 'Instagram', url: setting(settings, 'social.instagram') },
    { label: 'Facebook', url: setting(settings, 'social.facebook') },
    { label: 'X', url: setting(settings, 'social.x') },
  ].filter((social) => social.url.length > 0);

  return {
    name: setting(settings, 'shop.name', 'Chaska Koyla Karahi'),
    tagline: setting(settings, 'shop.tagline', 'Karahi on coal — chicken, boneless and mutton, Half or Full'),
    paymentMethods: paymentMethods(settings),
    phone: setting(settings, 'contact.phone'),
    email: setting(settings, 'contact.email'),
    address: setting(settings, 'contact.address'),
    hours: setting(settings, 'contact.hours'),
    socials,
    promo: parsePromo(settings),
    areas: allDeliveryAreas(settings),
    zones: deliveryZones(settings),
    testimonials: testimonials(settings),
    appLinks: {
      ios: setting(settings, 'app.ios_url'),
      android: setting(settings, 'app.android_url'),
    },
    newsletterUrl: setting(settings, 'shop.newsletter_url'),
  };
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const shop = await shopInfo();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: shop.name,
    description: shop.tagline,
    ...(shop.phone ? { telephone: shop.phone } : {}),
    ...(shop.address ? { address: shop.address } : {}),
    ...(shop.hours ? { openingHours: shop.hours } : {}),
    servesCuisine: 'Pakistani',
  };

  return (
    <ShopProvider value={shop}>
      <ToastProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col bg-paper">
            <a
              href="#main"
              className="sr-only z-[70] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-accent"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main" className="flex-1 pt-[var(--header-h)]">
              {children}
            </main>
            <SiteFooter />
            <CartDrawer />
            <FulfilmentGate />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />
          </div>
        </CartProvider>
      </ToastProvider>
    </ShopProvider>
  );
}
