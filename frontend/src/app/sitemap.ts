import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

const PUBLIC_PATHS = ['', 'menu', 'checkout', 'privacy', 'terms'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: path ? `${base}/${path}` : base,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));
}
