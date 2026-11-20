/**
 * Historical one-shot migration, already applied to production. Kept because
 * `uploaded_images` (menu photos served by /api/images/[id]) and `restaurant_tables`
 * were created here and appear in no drizzle generate() file.
 *
 * Every statement is additive and idempotent: a new enum value, a widened
 * channel check, new tables, and a settings row. Nothing existing is dropped or
 * rewritten, so re-running it is safe.
 *
 * Run with: npx tsx --env-file=../frontend/.env db/apply-qr-sync.ts
 */
import { Client } from 'pg';

const STATEMENTS: string[] = [
  // Order lifecycle gains 'served' (ready -> served -> completed).
  `ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'served'`,

  // Table QR orders get their own channel. The original apply-pos-sync script
  // added the check inline (anonymous name); drizzle names it explicitly.
  `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_channel_allowed`,
  `ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_channel_check`,
  `ALTER TABLE orders ADD CONSTRAINT orders_channel_allowed CHECK (channel IN ('website', 'pos', 'qr'))`,

  // Dine-in tables that own a QR menu link.
  `CREATE TABLE IF NOT EXISTS restaurant_tables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_name text NOT NULL,
    number integer NOT NULL,
    label text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT restaurant_tables_restaurant_number_key UNIQUE (restaurant_name, number)
  )`,

  // Exactly three initial tables for the restaurant.
  `INSERT INTO restaurant_tables (restaurant_name, number)
   VALUES ('Chaska Koyla Karahi', 1), ('Chaska Koyla Karahi', 2), ('Chaska Koyla Karahi', 3)
   ON CONFLICT (restaurant_name, number) DO NOTHING`,

  // Menu pictures uploaded from the POS. Stored in the database because the app
  // runs on serverless hosting, where request-time writes to disk are lost.
  `CREATE TABLE IF NOT EXISTS uploaded_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    filename text NOT NULL,
    content_type text NOT NULL,
    data text NOT NULL,
    size_bytes integer NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS uploaded_images_created_idx ON uploaded_images (created_at)`,

  // Rebrand: the POS derives businessName from shop.name.
  `INSERT INTO app_settings (key, value, updated_at)
   VALUES ('shop.name', 'Chaska Koyla Karahi', now())
   ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()`,
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set. Run with --env-file=.env');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: true } });
  await client.connect();
  try {
    for (const statement of STATEMENTS) {
      await client.query(statement);
      console.log('ok:', statement.replace(/\s+/g, ' ').slice(0, 72));
    }
  } finally {
    await client.end();
  }
  console.log('QR sync applied.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
