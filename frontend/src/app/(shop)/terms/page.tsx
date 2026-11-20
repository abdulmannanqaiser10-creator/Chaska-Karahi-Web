import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of sale',
  description: 'How orders, prices, discounts, delivery and cancellations work at Chaska Koyla Karahi.',
};

const CLAUSES = [
  {
    title: 'Placing an order',
    body: 'Adding dishes to a cart is not an order. An order exists once the server has re-priced your basket and created it; the kitchen then accepts or rejects it, and you can follow that status on the tracking page.',
  },
  {
    title: 'Prices and availability',
    body: 'Prices are shown in Pakistani rupees on the menu. A dish can sell out during service — tracked stock is checked when you order and again when the kitchen accepts, so a rejection or a shorter order is possible.',
  },
  {
    title: 'Discounts',
    body: 'A promo code takes its percentage off the food subtotal. Minimum-basket and first-order rules are enforced by the server, not by the banner, so an ineligible code is rejected before the order is created.',
  },
  {
    title: 'Payment',
    body: 'You pay when the order reaches you, with a method listed at checkout. This site does not take card details and does not claim a payment has happened — an order stays marked unpaid until staff confirm it in person.',
  },
  {
    title: 'Cancellations and rejects',
    body: 'Call the restaurant as soon as you can to cancel. Once the kitchen has accepted and started cooking, the food is already made. If we reject an order — sold out, unreachable number, an address outside the delivery areas — we record the reason and the order shows it on your tracking page.',
  },
  {
    title: 'Kitchen notes',
    body: 'Notes such as “less oil” are passed to the cook and treated as a request. Dishes are cooked in one kitchen with shared oil, tandoor and coal, so we cannot guarantee an allergen-free plate.',
  },
];

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="eyebrow">Terms</p>
      <h1 className="mt-2 font-heading text-4xl font-bold text-heading">Terms of sale</h1>
      <p className="mt-3 text-sm text-muted">
        Short on purpose. These describe how this ordering site behaves — if anything here disagrees with what the
        screen does, tell us and we will fix one of them.
      </p>

      <div className="mt-10 space-y-5">
        {CLAUSES.map((clause, index) => (
          <article key={clause.title} className="card p-6">
            <h2 className="font-heading text-lg font-semibold text-heading">
              <span className="mr-2 text-accent">{String(index + 1).padStart(2, '0')}</span>
              {clause.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{clause.body}</p>
          </article>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted">
        Questions before you order? Call the restaurant using the phone number listed in the footer.
      </p>
    </section>
  );
}
