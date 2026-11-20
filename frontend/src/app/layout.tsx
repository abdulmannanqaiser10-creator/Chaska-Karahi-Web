import type { Metadata, Viewport } from 'next';
import { Caveat, Inter, Noto_Nastaliq_Urdu, Playfair_Display } from 'next/font/google';
import { SITE_URL } from '@/lib/site-url';
import './globals.css';

/**
 * Playfair carries the brand voice (wordmark, headings, section titles); Inter runs
 * the UI so dense tables and forms stay legible at 12–14px; Caveat is reserved for the
 * small handwritten accents on the hero and the offer banner; Nastaliq sets the Urdu
 * names, which only read correctly in a nastaliq face.
 */
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const caveat = Caveat({
  variable: '--font-caveat',
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

const nastaliq = Noto_Nastaliq_Urdu({
  variable: '--font-nastaliq',
  subsets: ['arabic'],
  weight: ['400'],
  display: 'swap',
});

const BRAND = 'Chaska Koyla Karahi';
const SITE_TITLE = `${BRAND} — Karahi on Coal, Half or Full`;
const SITE_DESCRIPTION =
  'Chaska Koyla Karahi serves chicken, boneless and mutton karahi cooked to order on coal, with Balochi tikka, breads and drinks. Order online for delivery, pickup or dine-in at the table.';

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: `%s · ${BRAND}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: BRAND,
  authors: [{ name: BRAND }],
  creator: BRAND,
  publisher: BRAND,
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: BRAND,
    title: SITE_TITLE,
    description:
      'Chicken, boneless and mutton karahi cooked to order on coal, with Balochi tikka, breads and drinks. Half and Full prices shown separately.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `${BRAND} — karahi on coal` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description:
      'Chicken, boneless and mutton karahi cooked to order on coal — Half or Full, ordered online for delivery, pickup or the table.',
    images: ['/og.png'],
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0C0C0E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${caveat.variable} ${nastaliq.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Gates the scroll-reveal styles: without JS the content stays visible. The class is added
            before hydration, so React must not treat it as a mismatch. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
