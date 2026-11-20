# Deploying Chaska Koyla Karahi to Netlify (single site)

Production runs on Vercel (see `README.md`); this file covers the same repo on Netlify if that
host is ever preferred. One site serves both surfaces:

| Route            | Surface            | How                          |
|------------------|--------------------|------------------------------|
| `/`              | Customer website   | Next App Router SSR          |
| `/adminpanel`    | Admin panel        | Next App Router SSR + cookie guard |
| `/api/admin/*`   | Admin backend      | Next route handlers (`runtime='nodejs'`) → Netlify functions |
| `/api/orders`, `/api/images/*` | Checkout + menu photos | Next route handlers |

The database is **Neon Postgres** (external, already provisioned). Netlify does not host a
persistent Postgres — Neon is the correct companion service and the app connects per request.

## Environment variables (set in Netlify → Site configuration → Environment variables)

Never commit these or paste them into chat. Set runtime secrets directly in the Netlify
dashboard; do not import a checked-in `.env` file.

| Variable         | Purpose                                   | Source |
|------------------|-------------------------------------------|--------|
| `DATABASE_URL`   | Neon Postgres connection string (SSL)     | your Neon project; required at runtime |
| `SESSION_SECRET` | HS256 key for admin session JWTs          | 32+ random bytes; required at runtime |

`ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` are only read by `npm run db:seed` when
creating an admin account. The deployed login reads the admin from the database; do not run
the seed against production just to configure login. Delivery fees are disabled in the
storefront; no `DELIVERY_FEE` environment variable is used.

## Build settings (auto-applied from `netlify.toml`)

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `.next`
- Netlify's Next.js runtime compiles the App Router, `/api` handlers and middleware.
- Database schema and scripts live in the sibling `backend/` folder (imported at build via path alias).

## Deploy commands (requires Netlify auth)

```sh
npm i -g netlify-cli
netlify login                       # opens a browser; OR export NETLIFY_AUTH_TOKEN
netlify link                        # link this repo to an existing site
netlify init                        # create/link a new site instead
netlify deploy --build              # draft/preview build
netlify deploy --build --prod       # publish to the production URL
```

## Production behaviour & caveats

- **Realtime:** `/api/admin/orders/stream` is a Server-Sent Events feed. Netlify functions impose
  an idle/timeout limit on long-lived streams, so the admin panel degrades gracefully to polling
  `/api/admin/orders/alerts`. No order updates are lost — the database is the source of truth.
- **Rate limiting** is per-function-instance (in-memory). It is a best-effort abuse guard, not
  a global limiter; acceptable for this scale.
- **Menu photos** are stored in the `uploaded_images` table, not on disk, because the request-time
  filesystem on both hosts is read-only.

## Removed: the FoodPOS terminal

The in-store POS (`/foodpos`) and the whole `/api/v1/*` backend were deleted from this repo, along with
the `foodpos:sync` command that used to rebuild the vendored bundle. Their database tables
(`pos_held_orders`, `integration_events`) and rows remain, unused, for order history — see the note in
`README.md`. The dine-in QR menu (`/r/*`) was brought back as a public route; it is served by the Next.js
app, so no host configuration is needed for it.

## Post-deploy verification checklist

1. `/` renders; menu browsing, cart and checkout create a real order.
2. `/adminpanel/login` accepts `ADMIN_EMAIL`/`ADMIN_PASSWORD`; dashboard loads.
3. Admin edits a product price or uploads a photo → visible on `/menu` after refresh.
4. Customer order → appears Pending in Online Orders → Accept → status transitions and the kitchen ticket prints.
5. Accepting an order decrements tracked stock once, and a refresh does not double-deduct.
6. `/r/<shop name>/t/1` opens the table menu; ordering from it lands in Table Orders with the table number.
7. Walk-in Customers → Print KOT & Bill → the order saves once (a second click replays the idempotency key),
   tracked stock drops, and the KOT has no prices while the bill does.
8. `/foodpos` and `/api/v1/*` return 404.
