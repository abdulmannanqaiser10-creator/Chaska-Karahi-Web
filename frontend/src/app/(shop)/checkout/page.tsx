'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/cart/CartProvider';
import { useShop } from '@/components/shop/ShopProvider';
import { formatMoney, fromCents, toCents } from '@/lib/money';
import { cn } from '@/components/cn';

type FieldErrors = Record<string, string>;

/**
 * The two order lines the kitchen watches. Confirming the order opens WhatsApp
 * addressed to both, each with the full order message, and the confirmation
 * below keeps a manual link per number in case a popup blocker ate one.
 */
const WHATSAPP_NUMBERS = ['923123654448', '923432206754'] as const;
const WHATSAPP_DISPLAY = ['+923123654448', '+923432206754'] as const;

export default function CheckoutPage() {
  const { lines, subtotalCents, clear, count, setCoupon, area, mode, setMode, canOrder, openGate } = useCart();
  const shop = useShop();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    orderType: 'delivery' as 'delivery' | 'pickup',
    deliveryAddress: '',
    instructions: '',
    paymentMethod: shop.paymentMethods[0] ?? 'Cash on Delivery',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  /** One entry per WhatsApp line after a successful confirm; null until then. */
  const [whatsappLinks, setWhatsappLinks] = useState<{ url: string; display: string; blocked: boolean }[] | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The area picked in the header is a hint for the address box, never a substitute for it.
  useEffect(() => {
    if (area.length === 0) return;
    setForm((current) => (current.deliveryAddress.length > 0 ? current : { ...current, deliveryAddress: area }));
  }, [area]);

  // Checkout starts from the header's delivery/pickup choice and keeps it in sync.
  useEffect(() => {
    setForm((current) => (current.orderType === mode ? current : { ...current, orderType: mode }));
  }, [mode]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canOrder) {
      openGate();
      setMessage('Choose delivery or pickup, and your area, before placing the order.');
      return;
    }
    setSubmitting(true);
    setMessage(null);
    setErrors({});

    const rupees = (cents: number) => formatMoney(fromCents(cents));
    const orderItemsText = lines
      .map((line) => `• ${line.name} ×${line.quantity} — ${rupees(toCents(line.price) * line.quantity)}`)
      .join('\n');
    const delivery = form.orderType === 'delivery';
    const customer = [
      `Customer: ${form.name}`,
      `Phone: ${form.phone}`,
      form.email ? `Email: ${form.email}` : null,
      `Type: ${delivery ? 'Delivery' : 'Pickup'}`,
      delivery && form.deliveryAddress ? `Delivery address: ${form.deliveryAddress}` : null,
    ].filter(Boolean);
    const totals = [`Total: ${rupees(subtotalCents)}`, `Payment: ${form.paymentMethod}`];
    const message = [
      'New Order — Chaska Koyla Karahi',
      customer.join('\n'),
      `Items:\n${orderItemsText}`,
      totals.join('\n'),
      form.instructions ? `Kitchen note: ${form.instructions}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const encoded = encodeURIComponent(message);
    const urls = WHATSAPP_NUMBERS.map((number) => `https://wa.me/${number}?text=${encoded}`);
    const opened = urls.map((url) => window.open(url, '_blank'));
    setWhatsappLinks(
      urls.map((url, index) => ({
        url,
        display: WHATSAPP_DISPLAY[index],
        blocked: opened[index] === null || opened[index] === undefined,
      })),
    );

    clear();
    setCoupon('');
    setSubmitting(false);
  }

  if (count === 0 && !whatsappLinks) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-3xl font-bold text-heading">Your cart is empty</h1>
        <p className="mt-3 text-sm text-muted">Add a dish from the menu before checking out.</p>
        <Link href="/menu" className="btn btn-primary btn-lg mt-8">
          Browse the menu
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl overflow-x-hidden px-4 py-12 sm:px-6">
      <header className="mb-8">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-2 text-3xl font-bold text-heading sm:text-4xl">Complete your order</h1>
      </header>

      <form onSubmit={submit} className="space-y-6">
        {message && (
          <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {message}
          </div>
        )}

        {whatsappLinks && (
          <div role="status" className="rounded-2xl border border-success/30 bg-success/5 p-5">
            <h2 className="font-heading text-lg font-semibold text-heading">One step left — send it on WhatsApp</h2>
            <p className="mt-1.5 text-sm text-muted">
              The order is not placed until you send the message. Send it to both numbers so the kitchen receives it even
              if one line is busy.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {whatsappLinks.map((link) => (
                <a key={link.display} href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-md">
                  {link.blocked ? `Open WhatsApp ${link.display}` : `Resend to ${link.display}`}
                </a>
              ))}
            </div>
            <Link href="/menu" className="mt-4 inline-block text-xs font-semibold text-muted underline">
              Back to the menu
            </Link>
          </div>
        )}

        <fieldset className="card p-6">
          <legend className="font-heading text-lg font-semibold text-heading">Your details</legend>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" error={errors.name} htmlFor="name">
              <input
                id="name"
                className="field"
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                autoComplete="name"
                required
              />
            </Field>
            <Field label="Phone number" error={errors.phone} htmlFor="phone">
              <input
                id="phone"
                className="field"
                value={form.phone}
                onChange={(event) => update('phone', event.target.value)}
                inputMode="tel"
                autoComplete="tel"
                placeholder="+92 300 0000000"
                required
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Email (optional)" error={errors.email} htmlFor="email">
                <input
                  id="email"
                  type="email"
                  className="field"
                  value={form.email}
                  onChange={(event) => update('email', event.target.value)}
                  autoComplete="email"
                />
              </Field>
            </div>
          </div>
        </fieldset>

        <fieldset className="card p-6">
          <legend className="font-heading text-lg font-semibold text-heading">How would you like it?</legend>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(['delivery', 'pickup'] as const).map((type) => (
              <label
                key={type}
                className={cn(
                  'flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm transition-colors',
                  form.orderType === type ? 'border-accent bg-accent/5' : 'border-line bg-surface-2 hover:bg-surface-3',
                )}
              >
                <input
                  type="radio"
                  name="orderType"
                  value={type}
                  checked={form.orderType === type}
                  onChange={() => {
                    update('orderType', type);
                    setMode(type);
                  }}
                  className="mt-0.5 accent-accent"
                />
                <span>
                  <span className="block font-semibold capitalize text-heading">{type}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {type === 'delivery'
                      ? 'Delivered to your address'
                      : shop.address.length > 0
                        ? `Collect from ${shop.address}`
                        : 'Collect from the counter'}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {form.orderType === 'delivery' && (
            <div className="mt-4">
              <Field label="Delivery address" error={errors.deliveryAddress} htmlFor="address">
                <textarea
                  id="address"
                  rows={3}
                  className="field resize-none"
                  value={form.deliveryAddress}
                  onChange={(event) => update('deliveryAddress', event.target.value)}
                  placeholder="Street, building, apartment, city"
                />
              </Field>
            </div>
          )}

          <div className="mt-4">
            <Field label="Instructions (optional)" error={errors.instructions} htmlFor="instructions">
              <textarea
                id="instructions"
                rows={2}
                className="field resize-none"
                value={form.instructions}
                onChange={(event) => update('instructions', event.target.value)}
                placeholder="Extra hot, less oil, ring the bell…"
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className="card p-6">
          <legend className="font-heading text-lg font-semibold text-heading">Payment</legend>
          <div className="mt-5">
            <Field label="Payment method" error={errors.paymentMethod} htmlFor="payment">
              <select
                id="payment"
                className="field"
                value={form.paymentMethod}
                onChange={(event) => update('paymentMethod', event.target.value)}
              >
                {shop.paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </Field>
            <p className="mt-2 text-xs text-muted">
              Pay when your order arrives. The restaurant confirms the order and the amount on WhatsApp.
            </p>
          </div>
        </fieldset>

        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted">Order total</p>
            <p className="font-heading text-2xl font-bold text-accent">{formatMoney(fromCents(subtotalCents))}</p>
          </div>
          <button type="submit" disabled={submitting} className="btn btn-gold btn-lg w-full sm:w-auto">
            {submitting ? 'Placing your order…' : 'Confirm order'}
          </button>
        </div>
        <p className="text-center text-xs text-muted">Opens WhatsApp with your order ready to send. Nothing is charged online.</p>
      </form>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
