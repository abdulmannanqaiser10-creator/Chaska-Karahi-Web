import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  pgEnum,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  numeric,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const orderTypeEnum = pgEnum('order_type', ['delivery', 'pickup', 'dine_in', 'takeaway']);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'served',
  'completed',
  'rejected',
  'cancelled',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'unpaid',
  'paid',
  'refunded',
  'failed',
]);

export const admins = pgTable('admins', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('admin'),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique('admins_email_key').on(t.email)]);

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  /** Urdu heading shown beside the English one; NULL = English only. */
  nameUr: text('name_ur'),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique('categories_slug_key').on(t.slug)]);

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  /** Urdu name shown beside the English one on the menu; NULL = English only. */
  nameUr: text('name_ur'),
  /** 'Half' | 'Full' for a karahi; NULL on a single-price item such as an extra. */
  sizeLabel: text('size_label'),
  /** The dish a size row belongs to, e.g. 'chicken-shahi-karahi'. NULL = standalone. */
  groupKey: text('group_key'),
  description: text('description').notNull().default(''),
  /** Unit price in major units, e.g. "4.50". Always read/written through lib/money. */
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url').notNull().default(''),
  isAvailable: boolean('is_available').notNull().default(true),
  isPopular: boolean('is_popular').notNull().default(false),
  /** NULL = untracked (menu availability only); a number enables inventory + low-stock alerts. */
  stock: integer('stock'),
  lowStockThreshold: integer('low_stock_threshold').notNull().default(10),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('products_slug_key').on(t.slug),
  check('products_stock_non_negative', sql`${t.stock} IS NULL OR ${t.stock} >= 0`),
  check('products_low_stock_threshold_non_negative', sql`${t.lowStockThreshold} >= 0`),
  index('products_category_idx').on(t.categoryId),
  index('products_available_popular_idx').on(t.isAvailable, t.isPopular),
  index('products_group_idx').on(t.groupKey),
  uniqueIndex('products_group_size_key')
    .on(t.groupKey, t.sizeLabel)
    .where(sql`${t.groupKey} is not null`),
]);

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique('customers_phone_key').on(t.phone), index('customers_name_idx').on(t.name)]);

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Human-facing sequential number, e.g. CK-2026-000123 (legacy rows use the LC- prefix). */
  orderNumber: text('order_number').notNull(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
  /** Snapshots: a later profile or price edit must not rewrite order history. */
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  orderType: orderTypeEnum('order_type').notNull(),
  deliveryAddress: text('delivery_address'),
  instructions: text('instructions'),
  status: orderStatusEnum('status').notNull().default('pending'),
  /** 'website' from the storefront, 'qr' from a table menu, 'pos' from the admin counter. */
  channel: text('channel').notNull().default('website'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric('delivery_fee', { precision: 10, scale: 2 }).notNull().default('0.00'),
  /** Only ever set on historical 'pos' orders; website orders keep the zero defaults. */
  discount: numeric('discount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  tax: numeric('tax', { precision: 10, scale: 2 }).notNull().default('0.00'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  /** Table the order belongs to, e.g. "Table 3". Set by the table QR menu. */
  tableRef: text('table_ref'),
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('unpaid'),
  acceptedById: uuid('accepted_by_id').references(() => admins.id, { onDelete: 'set null' }),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  /** Set once, atomically, when an accepted website order's stock was claimed. */
  stockDeductedAt: timestamp('stock_deducted_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  /** Client-generated key so a retried checkout reuses its order instead of duplicating it. */
  idempotencyKey: text('idempotency_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('orders_order_number_key').on(t.orderNumber),
  unique('orders_idempotency_key_key').on(t.idempotencyKey),
  check('orders_channel_allowed', sql`${t.channel} in ('website', 'pos', 'qr')`),
  index('orders_status_created_idx').on(t.status, t.createdAt),
  index('orders_customer_idx').on(t.customerId),
]);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  productName: text('product_name').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  lineTotal: numeric('line_total', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('order_items_order_idx').on(t.orderId)]);

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  fromStatus: orderStatusEnum('from_status'),
  toStatus: orderStatusEnum('to_status').notNull(),
  note: text('note'),
  adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('order_status_history_order_idx').on(t.orderId)]);

export const orderPayments = pgTable('order_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  method: text('method').notNull(),
  status: paymentStatusEnum('status').notNull().default('unpaid'),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  /** Cash tender captured at the POS; changeDue is computed server-side. */
  received: numeric('received', { precision: 10, scale: 2 }),
  changeDue: numeric('change_due', { precision: 10, scale: 2 }),
  reference: text('reference'),
  capturedAt: timestamp('captured_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('order_payments_order_idx').on(t.orderId)]);

/**
 * One row per order awaiting an admin alert. The popup only surfaces unacked
 * alerts, so a refresh or reconnect cannot replay an order the admin already saw.
 */
export const orderAlerts = pgTable('order_alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  ackedAt: timestamp('acked_at', { withTimezone: true }),
  ackedById: uuid('acked_by_id').references(() => admins.id, { onDelete: 'set null' }),
}, (t) => [
  unique('order_alerts_order_id_key').on(t.orderId),
  index('order_alerts_unacked_idx').on(t.ackedAt),
]);

/**
 * Signed stock deltas for tracked products. Every deduction (website order
 * accepted, POS sale) and every return writes exactly one row, so the ledger
 * explains each product's current stock.
 */
export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  /** Positive = restock, negative = deduction. */
  quantity: integer('quantity').notNull(),
  reason: text('reason').notNull(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
  adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'set null' }),
  balanceAfter: integer('balance_after'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('stock_movements_product_idx').on(t.productId, t.createdAt),
  index('stock_movements_order_idx').on(t.orderId),
]);

/**
 * Retained POS table: its rows stay for history and nothing in the app reads or writes it.
 * Kept defined so `drizzle-kit generate` does not schedule a drop. Hold/Save tickets from the
 * old POS screen; cart lived in `payload`.
 */
export const posHeldOrders = pgTable('pos_held_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  payload: jsonb('payload').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0.00'),
  discount: numeric('discount', { precision: 10, scale: 2 }).notNull().default('0.00'),
  taxPercent: numeric('tax_percent', { precision: 5, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0.00'),
  createdById: uuid('created_by_id').references(() => admins.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Configurable shop copy (contact, hours, socials) so nothing is invented in code. */
export const appSettings = pgTable('app_settings', {
  key: text('key').notNull(),
  value: text('value').notNull().default(''),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.key] })]);

/**
 * Retained POS table: the outbox the old FoodPOS realtime stream consumed. Order accepts no
 * longer write to it, and existing rows are kept for history. Defining it here stops
 * `drizzle-kit generate` from scheduling a drop.
 */
export const integrationEvents = pgTable('integration_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('integration_events_recent_idx').on(t.createdAt), index('integration_events_unread_idx').on(t.readAt)]);

export const counters = pgTable('counters', {
  name: text('name').notNull(),
  value: integer('value').notNull().default(0),
}, (t) => [primaryKey({ columns: [t.name] })]);

/**
 * Dine-in tables, each owning a /r/<restaurant>/t/<number> menu link that the admin
 * Tables board copies, opens and prints as a QR code.
 */
export const restaurantTables = pgTable('restaurant_tables', {
  id: uuid('id').primaryKey().defaultRandom(),
  restaurantName: text('restaurant_name').notNull(),
  number: integer('number').notNull(),
  label: text('label'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [unique('restaurant_tables_restaurant_number_key').on(t.restaurantName, t.number)]);

/**
 * Menu pictures uploaded from the admin panel. Stored here rather than on disk because the
 * app runs on serverless hosting, where anything written at request time is gone on
 * the next invocation. Base64 text keeps the column portable across drivers;
 * products.imageUrl points at /api/images/<id>.
 */
export const uploadedImages = pgTable('uploaded_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  data: text('data').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index('uploaded_images_created_idx').on(t.createdAt)]);
