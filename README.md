# Chaska Koyla Karahi

Traditional Pakistani karahi ordering site with an admin panel — one Next.js 15
(App Router) app on Neon Postgres, deployed to Vercel.

## Where the code lives

The repo is organized into two top-level folders. The live site is still one Next.js
deploy (Netlify/Vercel) so cookies and `/api` stay on the same origin.

| Concern | Path |
| --- | --- |
| Frontend — Next.js app (pages, components, styles, assets, route handlers) | `frontend/` |
| Frontend — customer website pages | `frontend/src/app/(shop)/` |
| Frontend — shared components | `frontend/src/components/` |
| Frontend — theme, fonts, tokens | `frontend/src/app/globals.css`, `frontend/src/app/layout.tsx` |
| Frontend — REST route handlers (served by Next) | `frontend/src/app/api/` |
| Frontend — domain helpers used by the app | `frontend/src/lib/` |
| Backend — database schema + client | `backend/db/` |
| Backend — migrations | `backend/drizzle/` |
| Backend — ops scripts | `backend/scripts/` |

## Business rules that live in code

- **Time:** timestamps are stored in UTC; `src/lib/time.ts` is the only place that decides how they are
  displayed. Business zone is Asia/Karachi (`NEXT_PUBLIC_APP_TIMEZONE` to override). Server-side day
  windows (dashboard "today", report buckets) follow the same zone.
- **Money:** `src/lib/money.ts` holds the default currency (PKR, `NEXT_PUBLIC_CURRENCY` to override) and
  the symbol map; arithmetic runs in integer cents. Website prices, admin totals and printed tickets all
  resolve through the same formatter, which prints `Rs. 361` for a whole-rupee amount and keeps the decimals
  when a stored value really carries paisa (`Rs. 40.01`) — rounding is never applied to the stored number.
- **Branding:** visible names come from the `app_settings` table, not from source strings.
- **The welcome offer:** one admin-editable promotion lives in `promo.*` settings and is read through
  `src/lib/promo.ts`. The browser may *claim* a code, but `eligibleDiscountCents()` in `src/lib/orders.ts`
  re-checks the code, the minimum basket and the first-order rule inside the checkout transaction, so a
  discount that the server does not agree with simply cannot be saved. Blank code or `promo.active = off`
  removes the banner, the Offers page rules and the discount together — nothing is faked on the frontend.
- **Social proof:** dish cards show how many real online orders a product appears in
  (`getOrderCounts()` in `src/lib/menu.ts`), never an invented star rating. Reviews, delivery areas and
  app-store links come from `shop.testimonials`, `shop.delivery_areas` and `app.*` settings; when a key is
  empty the section is hidden instead of showing placeholder content.
- **Half and Full:** a karahi is one card on the menu but two orderable prices, so it is stored as two
  `products` rows — a Half row and a Full row — sharing a `group_key` and carrying a `size_label`. There is
  no variant table and no price arithmetic: `groupSizes()` in `src/lib/types.ts` folds the rows back into one
  dish for the storefront, the quick view, the product page, the table menu, the counter screen and the menu
  manager, while every order path still charges exactly the price on the row the customer picked. The
  partial unique index on `(group_key, size_label)` stops a dish from being given the same size twice.
- **Urdu names:** `categories.name_ur` and `products.name_ur` hold the signboard spellings, rendered with the
  `font-urdu` (Noto Nastaliq Urdu) token and `dir="rtl"` beside the English name wherever the dish is listed.

## Storefront routes

`/` (hero, categories, featured, offer, steps, reviews, app band, footer) · `/menu` (search + category
filter, quick view) · `/product/[slug]` (full detail, related dishes, JSON-LD) · `/cart` · `/checkout` ·
`/order/[orderNumber]` (confirmation + live status) · `/track-order` · `/offers` · `/locations` ·
`/about` · `/contact` · `/privacy` · `/terms`. There is no customer login: tracking is by order number
plus phone, which keeps the surface area small until accounts are actually wanted.

Theme tokens (`--color-paper`, `--color-accent`, `--color-gold`, …) are generic names, so the palette is a
value swap in `src/app/globals.css`; headings use Playfair Display, body Inter, and the `.hand` accent uses
Caveat. Motion is Framer Motion plus a shared IntersectionObserver reveal (`src/components/fx/`), gated on
`html.js` and disabled under `prefers-reduced-motion`.

### The opening Delivery / Pick-Up popup

`src/components/shop/FulfilmentGate.tsx` asks every new browser session two questions before the shop will
take an order: how the food leaves the shop, and for which area. `CartProvider` holds the answer as
`chaska.fulfilment-choice-v1` (localStorage) next to the existing `chaska.fulfilment-v1` mode key, and
exposes `canOrder` — `add()`, the cart's checkout button and the checkout form all refuse until it is true,
so nothing can be ordered by scrolling past the dialog. Browsing stays open: closing the popup is allowed
and it does not re-appear in the same tab (`chaska.fulfilment-asked` in sessionStorage). Someone who already
used the header bar arrives with that mode — and, if it was picked there, that area — pre-selected, so the
same choice never has to be made twice.

"Use Current Location" reads `navigator.geolocation` and only ever *pre-selects* the Area dropdown from the
nearest listed sub-region (`nearestDeliveryArea()` in `src/lib/zones.ts`); the customer still presses
Continue, so a wrong centroid cannot book a delivery nobody asked for. The table menu and the counter screen
have their own carts and never show this dialog — a guest at a table has already told the staff where the
food is going.

## Admin Settings the owner still needs to fill

Admin → Settings has groups for **Welcome offer**, **Reviews** and **Mobile app** alongside the existing
store fields. `shop.delivery_areas` (comma-separated), `shop.testimonials` (`Name | Location | Quote` per
line), `shop.newsletter_url`, `app.ios_url` and `app.android_url` ship empty on purpose — the site hides
what it cannot show rather than publishing invented content. Saving a field writes the `app_settings` row
if it does not exist yet, so no migration is needed.

`shop.delivery_zones` is the one exception: the popup needs a list to be usable, so it ships with an
editable Karachi placeholder — one city per line as `City | Area, Area~lat:lng`. The `~lat:lng` suffix is
optional and only feeds "Use Current Location"; the neighbourhoods and their approximate centroids are
placeholders, so confirm the areas you actually serve and delete the rest. `shop.price_status` is a free-text
notice that Menu Management prints above the grid; it is blank now that the karahi prices are the owner's
own, and writing a line there is how staff are told to treat the figures as provisional again.

## Commands

```sh
npm run dev            # local dev server
npm run typecheck      # tsc --noEmit
npm run lint           # eslint
npm run build          # production build
npm run print:bridge   # local thermal-print bridge for the counter PC (see scripts/print-bridge.mjs)
npm run db:migrate     # drizzle-kit migrate
npm run db:seed        # seed products/categories/admin
npx tsx --env-file=.env scripts/menu-replace.ts    # dry-run the live menu against src/db/menu-chaska.ts
npx tsx --env-file=.env scripts/menu-replace.ts --apply   # write it, backing up the current rows first
npx tsx --env-file=.env scripts/menu-audit.ts      # diff the live menu against the catalogue
npx tsx --env-file=.env scripts/delivery-zones.ts  # fill shop.delivery_zones if it is still blank
node scripts/photo-import.mjs                      # resize vibe_images/*.png into public/photos/*.jpg
node scripts/brand-assets.mjs                      # rebuild icon PNGs, icon.ico, favicon.ico and og.png
node --env-file=.env scripts/live-admin-check.mjs   # read-only production smoke test (one sign-in)
```

`scripts/live-admin-check.mjs` signs in exactly once — the login limiter is 8 attempts per 5 minutes — then
fetches each admin page and the list APIs with `redirect: 'manual'` and reports status codes, section markers
and any price that still carries paisa. It only reads.

Deploy: `npx vercel deploy --prod --yes` — re-aliases the existing production URL, no new deployment link.
See `NETLIFY.md` for the environment variables and an alternative host.

## Dine-in tables and counter sales

The admin panel covers the counter as well as the website:

- **Tables** (`/adminpanel/tables`) lists every row in `restaurant_tables` with its menu link
  `/r/<restaurant name>/t/<number>`. The Actions menu on each card copies the URL, opens it in a new
  tab, or shows a QR code that downloads as a PNG.
- The public table menu is served by `src/app/r/[restaurant]/t/[table]` and posts to
  `/api/r/[restaurant]/t/[table]/orders` (lib: `src/lib/qr.ts`). Those routes are outside the admin
  middleware matcher, so guests need no session. Orders arrive with `channel = 'qr'`, a `table_ref`
  and `status = 'pending'`.
- **Table Orders** (`/adminpanel/table-orders`) is that stream: table number, items, quantities,
  total, time and status, refreshed automatically and filterable by table and status. `listTableOrders()`
  reads `channel = 'qr'` only, so a sale a waiter rings in at the counter never appears twice.
- **Walk-in Customers** (`/adminpanel/walk-in`) rings a counter sale, then prints a KOT (no prices)
  and a customer bill from the same order. It creates `channel = 'pos'` with `status = 'accepted'`
  and deducts tracked stock in the same transaction; the client-generated idempotency key means a
  double click cannot sell the order twice. The cashier types nothing else — the API defaults stay
  takeaway / cash / walk-in guest — and the ticket panel scrolls its own item list so the total and
  print buttons stay on screen with 50 dishes on the ticket.
- **Online Orders** (`/adminpanel/online-orders`) is the old "New Orders" queue, now filtered to
  `channel = 'website'` because table orders have their own section. The live popup still surfaces
  every channel and labels table orders.

## Admin sections the source decides

- The dashboard has no Recent Orders table. Two cards — Online Orders and Table Orders — are fed by
  `getChannelSummary()` and `getOpenTableOrders()` in `src/lib/orders.ts`, and each links to its section.
- **All Orders** (`/adminpanel/orders`) has no Actions column. A row (or a mobile card) opens
  `OrderDrawer`, which prints the ticket, prints KOT & bill and changes status from the row it was
  given — no second fetch. `listOrders()` takes `channel` and `sort`, so the same component serves
  the website-only and counter-only lists without mixing sources.
- **Menu Management** (`/adminpanel/menu`) is a searchable, category-filtered image grid. Cards carry a
  4:3 `ProductImage`, price, stock badge, availability and popular switches; the editor keeps exact
  prices, so a paisa value stays a paisa value. Half and Full are edited as two rows with their own
  price, joined by the `groupKey` the card shows as one dish, and both carry a `nameUr` for the Urdu
  line. The card's photo is uploaded in place (POST to `/api/admin/images`, which stores the bytes in
  `uploaded_images` and repoints `products.imageUrl`), so the owner can replace any shot with no deploy.
  `scripts/menu-replace.ts` overwrites `imageUrl` from the catalogue, so re-running it after an upload
  in the panel puts the old file back.

## Removed: the FoodPOS terminal

The in-store POS terminal is gone; only the customer website and the admin panel remain. What that means concretely:

- `public/foodpos/` (the vendored SPA), every `/api/v1/*` route, and
  `src/lib/{pos,pos-events,pos-route,pos-auth}.ts` are deleted, along with the `foodpos:sync`,
  `db:pos:apply`, `db:pos:check` and `test:pos` scripts.
- `pos_held_orders` and `integration_events` still exist in the database and in
  `src/db/schema.ts`. Their rows are kept for history, but no code reads or writes them any more, so
  `drizzle-kit generate` will not drop them. Do not treat them as live state.
- `orders.channel` is `'website'` for storefront checkouts, `'qr'` for the table menu and `'pos'` for
  counter sales rung in from Walk-in Customers. The old POS terminal wrote `'pos'` too, so its
  historical rows still render in the admin order list.
- Admin Settings no longer exposes `pos.tax_percent` or `pos.currency`; `pos.receipt_footer` stays because
  the admin panel's ticket printing still reads it, and printing itself is unchanged. Counter tickets still
  bill exactly their subtotal — only website checkouts can carry `orders.discount`, from the welcome offer.
