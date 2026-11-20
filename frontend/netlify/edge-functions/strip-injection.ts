import type { Config } from 'npm:@netlify/edge-functions';

/**
 * Netlify's edge injects a marketing comment into <head> of HTML responses
 * (browser User-Agents only). React 19 hydrates <head> and treats the extra
 * node as a mismatch, logging "Minified React error #418" on every page.
 *
 * This function post-processes HTML responses and removes the injected comment
 * if it is present at this layer. The `x-nf-inject-seen` response header records
 * whether the comment was visible here, which tells us which layer injects it.
 */
const INJECTED_COMMENT = /\n<!-- This site is hosted on Netlify[\s\S]*?-->/;

export default async (_request: Request, context: Context) => {
  const response = await context.next();
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) return response;

  const html = await response.text();
  const saw = INJECTED_COMMENT.test(html);
  const cleaned = html.replace(INJECTED_COMMENT, '');

  const headers = new Headers(response.headers);
  headers.set('x-nf-inject-seen', saw ? 'yes' : 'no');
  headers.delete('content-length');

  return new Response(cleaned, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export const config: Config = { path: '/*' };
