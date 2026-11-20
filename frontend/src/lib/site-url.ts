/**
 * Canonical origin used by everything that emits an absolute URL:
 * `metadataBase` (canonical + Open Graph), `robots.txt` and `sitemap.xml`.
 *
 * These render on the server, so the Netlify-provided `URL` (the site's primary
 * domain, set for every deploy) is read first; `NEXT_PUBLIC_SITE_URL` lets any
 * host — a custom domain, a preview — override it. The Netlify domain is the
 * fallback so a plain local `next build` still produces correct absolute URLs
 * instead of pointing at a domain the site no longer lives on.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  'https://chaska-koyla-karahi.netlify.app'
).replace(/\/+$/, '');

/** Absolute URL for a path on the site: `siteUrl('/menu')` → `https://…/menu`. */
export function siteUrl(path = ''): string {
  if (path === '') return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}
