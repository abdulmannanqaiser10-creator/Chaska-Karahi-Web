import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AppPromo } from '@/components/shop/AppPromo';
import { CategoryRail, type CategoryCard } from '@/components/shop/CategoryRail';
import { FeaturedSection } from '@/components/shop/FeaturedSection';
import { Hero, type HeroCopy } from '@/components/shop/Hero';
import { HowItWorks } from '@/components/shop/HowItWorks';
import { Testimonials } from '@/components/shop/Testimonials';
import { getOrderCounts, getPublicMenu } from '@/lib/menu';
import { allDeliveryAreas, getSettings, setting, splitHeading, testimonials } from '@/lib/settings';
import { groupSizes } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Fallback line shown only when a category has no description of its own. */
const CATEGORY_BLURBS: Record<string, string> = {
  'chicken-karahi': 'Bone-in chicken in its own masala',
  'chicken-boneless-karahi': 'The same masalas, boneless and cut to piece',
  'mutton-karahi': 'Bone-in mutton cooked slow over coal',
  'chaska-special': 'The house plate, off the grill',
  extras: 'Naan, chini, salad, raita and cold drinks',
};

const HERO_FALLBACK = {
  eyebrow: 'TRADITIONAL PAKISTANI KARAHI & CHARCOAL GRILL',
  heading: 'Karahi on coal.\nFlavour you can taste.',
  body: 'Chicken, boneless and mutton karahi, fired to order in its own masala and delivered hot across the city — Half or Full.',
};

export default async function HomePage() {
  const [menu, settings, orderCounts] = await Promise.all([getPublicMenu(), getSettings(), getOrderCounts()]);

  const [line1, line2] = splitHeading(setting(settings, 'shop.hero_heading', HERO_FALLBACK.heading));

  const copy: HeroCopy = {
    eyebrow: setting(settings, 'shop.hero_eyebrow', HERO_FALLBACK.eyebrow),
    line1,
    line2,
    body: setting(settings, 'shop.hero_body', HERO_FALLBACK.body),
    image: '/photos/hero-karahi.jpg',
    imageAlt: 'A karahi pot of red masala sitting over glowing charcoal embers',
  };

  const categories: CategoryCard[] = menu.categories.map((categoryRow) => {
    const items = menu.products.filter((product) => product.categorySlug === categoryRow.slug);
    const cover = items.find((item) => item.imageUrl)?.imageUrl ?? '';
    return {
      slug: categoryRow.slug,
      name: categoryRow.name,
      nameUr: categoryRow.nameUr,
      subtitle: (categoryRow.description || CATEGORY_BLURBS[categoryRow.slug] || 'Freshly prepared to order.')
        .split('.')[0],
      // A karahi is one card even though Half and Full are two rows.
      count: groupSizes(items).length,
      cover,
    };
  });

  const dishes = groupSizes(menu.products);
  const popular = dishes.filter((dish) => dish.some((row) => row.isPopular));
  const featured = (popular.length > 0 ? popular : dishes).slice(0, 8);

  return (
    <>
      <Hero copy={copy} areas={allDeliveryAreas(settings)} />
      <CategoryRail categories={categories} />
      <FeaturedSection dishes={featured} orderCounts={orderCounts} />

      <HowItWorks />
      <Testimonials items={testimonials(settings)} />
      <AppPromo
        brand={setting(settings, 'shop.name', 'Chaska Koyla Karahi')}
        links={{ ios: setting(settings, 'app.ios_url'), android: setting(settings, 'app.android_url') }}
        products={featured.map((dish) => dish[0])}
      />

      <section aria-labelledby="closing-heading" className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center sm:gap-5 sm:p-8">
          <div>
            <h2 id="closing-heading" className="font-heading text-2xl font-bold text-heading">
              Hungry now?
            </h2>
            <p className="mt-1.5 text-sm text-muted">
              Build a cart and check out in under a minute — cash or card when it reaches you.
            </p>
          </div>
          <Link href="/menu" className="btn btn-primary btn-lg shine shrink-0">
            Browse the full menu <ArrowRight size={17} aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
