import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What this ordering site stores, who can see it and how to ask for it to be removed.',
};

const POINTS = [
  {
    title: 'What we collect from an order',
    body: 'Your name, phone number, optional email, the delivery address you type, your instructions, and the dishes you ordered. That is the whole list — it is what the kitchen needs to cook and deliver the food.',
  },
  {
    title: 'Who can see it',
    body: 'Restaurant staff signed in to the admin panel. There is no third-party advertising or analytics script on this site, and we do not sell order data.',
  },
  {
    title: 'Your cart and promo code',
    body: 'Both are kept in your own browser’s local storage so the cart survives a refresh. Nothing in them is sent to us until you place an order, and clearing your browser data removes them.',
  },
  {
    title: 'No card details are taken here',
    body: 'Payment is collected when the order arrives. This site never asks for a card number, a CVV or a wallet credential, so there is no payment data to leak.',
  },
  {
    title: 'Order tracking',
    body: 'The tracking page matches the full order number exactly. It is not a search — guessing a number will not list somebody else’s order — but treat your order number as private all the same.',
  },
  {
    title: 'How long we keep orders',
    body: 'Orders stay in the restaurant’s records for accounting and for the printed-ticket history. Ask us and we will delete the ones tied to your phone number.',
  },
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="eyebrow">Privacy</p>
      <h1 className="mt-2 font-heading text-4xl font-bold text-heading">Privacy in plain words</h1>
      <p className="mt-3 text-sm text-muted">
        This is an ordering site, not an advertising business. Below is what actually happens to your data, written
        against how the site is built rather than a template.
      </p>

      <div className="mt-10 space-y-6">
        {POINTS.map((point) => (
          <article key={point.title} className="card p-6">
            <h2 className="font-heading text-lg font-semibold text-heading">{point.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{point.body}</p>
          </article>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted">
        To ask about your data, call the restaurant using the phone number listed in the footer. An administrator can
        look up every order by the phone number it was placed on.
      </p>
    </section>
  );
}
