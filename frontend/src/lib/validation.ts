import { z } from 'zod';

export const ORDER_TYPES = ['delivery', 'pickup'] as const;
export const ADMIN_ORDER_STATUSES = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'served',
  'completed',
  'rejected',
  'cancelled',
] as const;

const phone = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number.')
  .max(20, 'Enter a valid phone number.')
  .regex(/^[0-9+\-\s()]+$/, 'Enter a valid phone number.');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MESSAGE = 'Use lowercase letters, numbers and hyphens.';

/**
 * A field the admin cleared arrives as '' and has to be stored as NULL, otherwise
 * "no Urdu name" and "an empty Urdu name" become two things the menu has to guess between.
 */
function blankToNull(value: unknown) {
  return typeof value === 'string' && value.trim() === '' ? null : value;
}

function optionalText(max: number, message: string) {
  return z.preprocess(blankToNull, z.string().trim().max(max, message).nullable()).default(null);
}

function optionalSlug(max: number) {
  return z
    .preprocess(blankToNull, z.string().trim().max(max, 'Too long.').regex(SLUG_PATTERN, SLUG_MESSAGE).nullable())
    .default(null);
}

/** Half and Full are two `products` rows of one dish; anything else has no size. */
const sizeLabelSchema = z
  .preprocess(blankToNull, z.enum(['Half', 'Full']).nullable())
  .default(null);

export const checkoutSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().uuid('Unknown product.'),
          quantity: z.coerce.number().int().min(1).max(30),
          notes: z.string().trim().max(200).optional(),
        }),
      )
      .min(1, 'Your cart is empty.')
      .max(30, 'Too many line items.'),
    customer: z.object({
      name: z.string().trim().min(2, 'Enter your full name.').max(80),
      phone,
      email: z.union([z.string().trim().email('Enter a valid email.').max(120), z.literal('')]).optional(),
    }),
    orderType: z.enum(ORDER_TYPES),
    deliveryAddress: z.string().trim().max(300).optional(),
    instructions: z.string().trim().max(300).optional(),
    paymentMethod: z.string().trim().min(2).max(60),
    /** Compared against the admin-configured promotion on the server; never trusted from the browser. */
    coupon: z.string().trim().max(30).optional(),
    idempotencyKey: z.string().min(8).max(64),
  })
  .refine(
    (value) => value.orderType !== 'delivery' || (value.deliveryAddress ?? '').length >= 10,
    { message: 'Enter a delivery address (at least 10 characters).', path: ['deliveryAddress'] },
  );

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(120),
  password: z.string().min(1, 'Enter your password.').max(200),
});

export const statusChangeSchema = z.object({
  orderId: z.string().uuid('Unknown order.'),
  status: z.enum(ADMIN_ORDER_STATUSES),
  reason: z.string().trim().max(300).optional(),
});

export const alertAckSchema = z.object({
  orderId: z.string().uuid('Unknown order.'),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Name is too short.').max(60),
  /** Optional Urdu heading. NULL means the section shows English only. */
  nameUr: optionalText(120, 'Urdu name is too long.'),
  slug: z
    .string()
    .trim()
    .regex(SLUG_PATTERN, SLUG_MESSAGE)
    .max(60),
  description: z.string().trim().max(200).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short.').max(80),
  nameUr: optionalText(120, 'Urdu name is too long.'),
  slug: z
    .string()
    .trim()
    .regex(SLUG_PATTERN, SLUG_MESSAGE)
    .max(80),
  /**
   * The dish a Half/Full row belongs to. Rows sharing a key render as one menu card and
   * the database refuses the same size twice under one key.
   */
  groupKey: optionalSlug(80),
  sizeLabel: sizeLabelSchema,
  description: z.string().trim().max(200).default(''),
  /** Accepts "4.50" or 4.5 — normalised to a two-decimal string before writing. Prices are rupee-denominated. */
  price: z.coerce.number().positive('Price must be greater than zero.').max(999999),
  categoryId: z.string().uuid('Choose a category.'),
  imageUrl: z.string().trim().max(500).default(''),
  isAvailable: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  /**
   * null = untracked; a number turns the product into managed inventory.
   * z.null() is listed first on purpose — z.coerce.number() would coerce null to 0
   * and silently turn an untracked item into "out of stock" on every save.
   */
  stock: z.union([z.null(), z.coerce.number().int('Stock must be a whole number.').min(0).max(1000000)]).default(null),
  lowStockThreshold: z.coerce.number().int('Low-stock level must be a whole number.').min(0).max(10000).default(10),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export const settingsSchema = z.object({
  values: z.record(z.string().max(60), z.string().max(2000)).refine(
    (map) => Object.keys(map).length > 0 && Object.keys(map).length <= 50,
    'Send between 1 and 50 settings.',
  ),
});

export const orderQuerySchema = z.object({
  status: z.enum(ADMIN_ORDER_STATUSES).optional(),
  search: z.string().trim().max(80).optional(),
  /** The admin sections are split by source, so a list can ask for one channel only. */
  channel: z.enum(['website', 'qr', 'pos']).optional(),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).default('newest'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(5).max(100).default(10),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
