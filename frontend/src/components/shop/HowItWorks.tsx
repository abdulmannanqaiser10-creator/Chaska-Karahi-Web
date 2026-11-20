import { ArrowRight, ClipboardList, Bike, ShoppingBag } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Browse Menu',
    body: 'Explore the karahi list with Half and Full prices, live availability and Urdu names.',
  },
  {
    icon: ShoppingBag,
    title: 'Add to Cart',
    body: 'Choose your dishes, add a kitchen note and place the order in under a minute.',
  },
  {
    icon: Bike,
    title: 'Fast Delivery',
    body: 'The kitchen fires your order the moment it lands, then it leaves hot for your door.',
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="steps-heading" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-20">
      <p className="eyebrow">Easy steps</p>
      <h2 id="steps-heading" className="mt-3 font-heading text-[clamp(1.75rem,3.6vw,2.6rem)] font-bold text-heading">
        How It Works
      </h2>
      <p className="mt-2 text-sm text-muted">Get your favourite food in just a few clicks.</p>

      <ol className="mt-8 grid gap-8 sm:mt-10 md:grid-cols-3 md:gap-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative flex flex-col items-center px-2 text-center">
            <span className="relative grid h-20 w-20 place-items-center rounded-full bg-surface-2 text-accent">
              <step.icon size={30} strokeWidth={1.6} aria-hidden />
              <span className="absolute -left-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-gold text-xs font-bold text-charcoal shadow-[0_4px_10px_-4px_rgba(235,165,45,0.9)]">
                {index + 1}
              </span>
            </span>
            <h3 className="mt-5 text-lg font-semibold text-heading">{step.title}</h3>
            <p className="mt-2 max-w-[19rem] text-sm leading-relaxed text-muted">{step.body}</p>
            {index < STEPS.length - 1 && (
              <ArrowRight
                size={22}
                aria-hidden
                className="absolute -right-3 top-[3.1rem] hidden text-line-strong md:block"
              />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
