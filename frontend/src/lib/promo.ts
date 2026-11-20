import { formatMoney, fromCents, toCents } from './money';

/**
 * A single, admin-editable welcome promotion stored in `app_settings`. One code is
 * deliberate: a coupon engine with a table, per-code windows and usage limits is more
 * than this shop runs, and a settings-driven code keeps the promise on the banner and
 * the rule the server applies in exactly one place.
 */
export type Promo = {
  code: string;
  percent: number;
  minSubtotalCents: number;
  firstOrderOnly: boolean;
  label: string;
  body: string;
};

const YES = new Set(['1', 'true', 'yes', 'on']);

function flag(value: string | undefined, fallback: boolean): boolean {
  const text = value?.trim().toLowerCase();
  if (text === undefined || text.length === 0) return fallback;
  return YES.has(text);
}

/** Reads the promo out of a settings map. Safe on both server and client — no database import. */
export function parsePromo(settings: Record<string, string>): Promo | null {
  if (!flag(settings['promo.active'], true)) return null;
  const code = (settings['promo.code'] ?? '').trim().toUpperCase();
  const percent = Math.floor(Number(settings['promo.percent'] ?? ''));
  if (code.length === 0 || !Number.isFinite(percent) || percent <= 0 || percent > 90) return null;

  const minRaw = Number((settings['promo.min_subtotal'] ?? '0').trim());
  return {
    code,
    percent,
    minSubtotalCents: Number.isFinite(minRaw) && minRaw > 0 ? toCents(String(minRaw)) : 0,
    firstOrderOnly: flag(settings['promo.first_order_only'], true),
    label: (settings['promo.label'] ?? '').trim(),
    body: (settings['promo.body'] ?? '').trim(),
  };
}

export function matchesPromo(promo: Promo | null, candidate: string | null | undefined): boolean {
  if (!promo) return false;
  return (candidate ?? '').trim().toUpperCase() === promo.code;
}

/** Percentage off the subtotal, floored to the cent and never more than the subtotal. */
export function discountCents(promo: Promo, subtotalCents: number): number {
  const raw = Math.floor((subtotalCents * promo.percent) / 100);
  return Math.max(0, Math.min(raw, subtotalCents));
}

/** Human-readable eligibility rules, shown next to the field so a rejection is not a mystery. */
export function promoRules(promo: Promo): string[] {
  const rules = [`${promo.percent}% off the food subtotal`];
  if (promo.minSubtotalCents > 0) rules.push(`orders from ${formatMoney(fromCents(promo.minSubtotalCents))}`);
  if (promo.firstOrderOnly) rules.push('first online order only');
  return rules;
}
