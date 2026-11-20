/**
 * Menu-size migration: gives a dish its Half/Full pair and its Urdu name.
 *
 * A karahi is one card on the menu but two orderable price points, so the pair
 * stays two `products` rows — every order path re-reads `products.price`
 * server-side, and collapsing them into one row would mean rewriting the cart,
 * checkout, QR orders, walk-ins, stock and receipts. `group_key` is what tells
 * the UI which rows are the same dish.
 *
 * Every statement is additive and idempotent: nullable columns plus indexes.
 * Nothing existing is dropped or rewritten, so re-running this is safe. The
 * drizzle snapshots in `drizzle/` are already behind the live database (see
 * apply-qr-sync.ts), so this ships as raw SQL instead of `drizzle-kit generate`.
 *
 * Run with: npx tsx --env-file=../frontend/.env db/apply-menu-sizes.ts
 */
import { Client } from 'pg';

const STATEMENTS: string[] = [
  // 'Half' | 'Full' — NULL on a single-price item (an extra, or legacy rows).
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS size_label text`,

  // Shared dish key across a size pair, e.g. 'chicken-shahi-karahi'. NULL = standalone.
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS group_key text`,

  // Urdu name shown beside the English one on the menu; NULL = English only.
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ur text`,
  `ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_ur text`,

  // Menu grouping reads the whole pair at once.
  `CREATE INDEX IF NOT EXISTS products_group_idx ON products (group_key)`,

  // A dish may not carry the same size twice — the owner-facing guard against
  // accidental duplicate rows when editing the menu. Partial, so standalone
  // items (group_key NULL) are unconstrained.
  `CREATE UNIQUE INDEX IF NOT EXISTS products_group_size_key
     ON products (group_key, size_label)
     WHERE group_key IS NOT NULL`,
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
  console.log('Menu-size sync applied.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
