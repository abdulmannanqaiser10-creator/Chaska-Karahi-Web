const CENTS = 100;

/**
 * Signs instead of ISO codes, so a bill reads "Rs. 1,500" rather than "PKR 1,500.00".
 * The website, admin panel and printed tickets all resolve currency through here.
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  LKR: 'Rs.',
  PKR: 'Rs.',
  INR: '₹',
  AED: 'AED',
  SAR: 'SAR',
};

/** Business default; override with NEXT_PUBLIC_CURRENCY at build time. */
export const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_CURRENCY?.trim().toUpperCase() || 'PKR';

export function currencySymbol(code: string = DEFAULT_CURRENCY): string {
  return CURRENCY_SYMBOLS[code.toUpperCase()] ?? code.toUpperCase();
}

/**
 * Money is stored as numeric(10,2), which pg returns as a string. All arithmetic
 * happens in integer cents so totals never drift on float addition.
 */
export function toCents(value: string | number): number {
  if (typeof value === 'number') return Math.round(value * CENTS);
  const text = value.trim();
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace(/^-/, '').split('.');
  const padded = (fraction + '00').slice(0, 2);
  const cents = Number(whole || '0') * CENTS + Number(padded || '0');
  if (!Number.isFinite(cents)) throw new Error(`Unparsable money value: ${value}`);
  return negative ? -cents : cents;
}

export function fromCents(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(Math.round(cents));
  return `${sign}${Math.floor(abs / CENTS)}.${String(abs % CENTS).padStart(2, '0')}`;
}

export function formatMoney(value: string | number, currency: string = DEFAULT_CURRENCY): string {
  const cents = toCents(value);
  // Rupee prices are quoted whole, so "Rs. 1,250" reads better than "Rs. 1,250.00" on a
  // screen or a ticket. A price that really does carry paisa keeps its decimals — hiding
  // them would print an amount that is not the amount charged.
  const fractionDigits = Math.abs(cents) % CENTS === 0 ? 0 : 2;
  const amount = new Intl.NumberFormat('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: 2 }).format(
    Math.abs(cents) / CENTS,
  );
  const sign = cents < 0 ? '-' : '';
  const symbol = currencySymbol(currency);
  // "$4.50" for a bare sign, "Rs. 4.50" / "AED 4.50" for a word-like code.
  const spaced = /[A-Za-z.]/.test(symbol) ? ' ' : '';
  return `${sign}${symbol}${spaced}${amount}`;
}

export function centsSum(...values: Array<string | number>): number {
  return values.reduce<number>((total, value) => total + toCents(value), 0);
}
