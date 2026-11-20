/**
 * The Chaska Koyla Karahi menu, exactly as the owner supplied it (2026-10-30).
 *
 * This module is the single source of truth for three consumers: `src/db/seed.ts`
 * (a fresh database), `scripts/menu-replace.ts` (the one-shot live swap) and the
 * audit script that proves the two agree. Prices are rupee strings written
 * straight into `products.price` — nothing here is estimated or rounded.
 * Beef Karahi and Keema Karahi sit under Chaska Special with Half/Full sizes.
 *
 * A karahi is one card on the menu but two orderable price points, so each dish
 * expands into a Half row and a Full row sharing a `groupKey`. Keeping them as
 * two `products` rows is deliberate: every order path re-reads `products.price`
 * server-side, so a single row with two prices would need the cart, checkout,
 * QR orders, walk-ins, stock and receipts rewritten around a variant concept.
 *
 * Every row carries a photograph: the karahi, bread and side shots are the ones
 * `scripts/photo-import.mjs` rasterises from the generated set in `vibe_images/`, and
 * the owner replaces any of them from the panel under Admin → Menu Management, which
 * writes the same `products.imageUrl` column with no deploy. A blank here would render
 * the neutral "No image" tile on the card, so nothing in this catalogue is left empty.
 */

export type ChaskaCategory = {
  slug: string;
  name: string;
  nameUr: string;
  description: string;
  sortOrder: number;
};

export type ChaskaDish = {
  /** Becomes `products.group_key` for both size rows of this dish. */
  key: string;
  name: string;
  nameUr: string;
  description: string;
  category: string;
  image: string;
  /** [Half, Full] in rupees, exactly as printed on the owner's menu. */
  sizes: [half: string, full: string];
};

export type ChaskaExtra = {
  slug: string;
  name: string;
  nameUr: string;
  description: string;
  price: string;
  image: string;
};

export const CHASKA_CATEGORIES: ChaskaCategory[] = [
  {
    slug: 'chicken-karahi',
    name: 'Chicken Karahi',
    nameUr: 'چکن کراہی',
    description: 'Bone-in chicken fired to order in its own masala over coal.',
    sortOrder: 1,
  },
  {
    slug: 'chicken-boneless-karahi',
    name: 'Chicken Boneless Karahi',
    nameUr: 'چکن بون لیس کراہی',
    description: 'The same masalas with boneless chicken, cut to piece.',
    sortOrder: 2,
  },
  {
    slug: 'mutton-karahi',
    name: 'Mutton Karahi',
    nameUr: 'مٹن کراہی',
    description: 'Bone-in mutton cooked slow until the masala sets.',
    sortOrder: 3,
  },
  {
    slug: 'chaska-special',
    name: 'Chaska Special',
    nameUr: 'چسکا اسپیشل',
    description: 'House specials off the coal.',
    sortOrder: 4,
  },
  {
    slug: 'extras',
    name: 'Extras',
    nameUr: 'ایکسٹرا',
    description: 'Breads, chutney, salad and drinks to sit beside the karahi.',
    sortOrder: 5,
  },
];

export const CHASKA_DISHES: ChaskaDish[] = [
  // ── Chicken Karahi ──────────────────────────────────────────────────────────
  {
    key: 'chicken-shahi-karahi',
    name: 'Chicken Shahi Karahi',
    nameUr: 'چکن شاہی کراہی',
    description: 'Bone-in chicken in a rich shahi masala with fresh cream, ginger and green chilli.',
    category: 'chicken-karahi',
    image: '/photos/chicken-shahi-karahi.jpg',
    sizes: ['1000', '2000'],
  },
  {
    key: 'chicken-badshahi-karahi',
    name: 'Chicken Badshahi Karahi',
    nameUr: 'چکن بادشاہی کراہی',
    description: 'Bone-in chicken slow-cooked in a dark, deep-spiced badshahi masala with crisp onion.',
    category: 'chicken-karahi',
    image: '/photos/chicken-badshahi-karahi.jpg',
    sizes: ['1000', '2000'],
  },
  {
    key: 'chicken-green-karahi',
    name: 'Chicken Green Karahi',
    nameUr: 'چکن سبز کراہی',
    description: 'Bone-in chicken in a fresh coriander and mint green masala — light and herby.',
    category: 'chicken-karahi',
    image: '/photos/chicken-green-karahi.jpg',
    sizes: ['1000', '2000'],
  },
  {
    key: 'chicken-brown-karahi',
    name: 'Chicken Brown Karahi',
    nameUr: 'چکن بھورا کراہی',
    description: 'Bone-in chicken in a classic well-reduced brown tomato, ginger and black-pepper masala.',
    category: 'chicken-karahi',
    image: '/photos/chicken-brown-karahi.jpg',
    sizes: ['1000', '2000'],
  },
  {
    key: 'chicken-white-karahi',
    name: 'Chicken White Karahi',
    nameUr: 'چکن سفید کراہی',
    description: 'Bone-in chicken in a mild white cream karahi with cracked black pepper, cooked without tomato.',
    category: 'chicken-karahi',
    image: '/photos/chicken-white-karahi.jpg',
    sizes: ['1100', '2200'],
  },
  {
    key: 'chicken-malai-white-karahi',
    name: 'Chicken Malai White Karahi',
    nameUr: 'چکن ملائی سفید کراہی',
    description: 'Bone-in chicken in a soft malai masala — cream, butter and white pepper, no chilli heat.',
    category: 'chicken-karahi',
    image: '/photos/chicken-malai-white-karahi.jpg',
    sizes: ['1100', '2200'],
  },
  {
    key: 'chicken-lemon-chaska-white-karahi',
    name: 'Chicken Lemon Chaska White Karahi',
    nameUr: 'چکن لیموں چسکا سفید کراہی',
    description: 'White karahi finished at the pass with lemon and the house chaska seasoning.',
    category: 'chicken-karahi',
    image: '/photos/chicken-lemon-chaska-white-karahi.jpg',
    sizes: ['1100', '2200'],
  },

  // ── Chicken Boneless Karahi ─────────────────────────────────────────────────
  {
    key: 'boneless-shahi-karahi',
    name: 'Chicken Boneless Shahi Karahi',
    nameUr: 'چکن بون لیس شاہی کراہی',
    description: 'Boneless chicken in a rich shahi masala with fresh cream, ginger and green chilli.',
    category: 'chicken-boneless-karahi',
    image: '/photos/boneless-shahi-karahi.jpg',
    sizes: ['1250', '2500'],
  },
  {
    key: 'boneless-badshahi-karahi',
    name: 'Chicken Boneless Badshahi Karahi',
    nameUr: 'چکن بون لیس بادشاہی کراہی',
    description: 'Boneless chicken in a dark, deep-cooked badshahi masala with whole spices and crisp onion.',
    category: 'chicken-boneless-karahi',
    image: '/photos/boneless-badshahi-karahi.jpg',
    sizes: ['1250', '2500'],
  },
  {
    key: 'boneless-green-karahi',
    name: 'Chicken Boneless Green Karahi',
    nameUr: 'چکن بون لیس سبز کراہی',
    description: 'Boneless chicken in a vivid coriander and mint green masala, fresh and herby.',
    category: 'chicken-boneless-karahi',
    image: '/photos/boneless-green-karahi.jpg',
    sizes: ['1250', '2500'],
  },
  {
    key: 'boneless-white-karahi',
    name: 'Chicken Boneless White Karahi',
    nameUr: 'چکن بون لیس سفید کراہی',
    description: 'Boneless chicken in a white cream-and-black-pepper karahi, cooked without tomato.',
    category: 'chicken-boneless-karahi',
    image: '/photos/boneless-white-karahi.jpg',
    sizes: ['1300', '2600'],
  },
  {
    key: 'boneless-malai-white-karahi',
    name: 'Chicken Boneless Malai White Karahi',
    nameUr: 'چکن بون لیس ملائی سفید کراہی',
    description: 'Boneless chicken in a soft malai masala — cream, butter and white pepper, no chilli heat.',
    category: 'chicken-boneless-karahi',
    image: '/photos/boneless-malai-white-karahi.jpg',
    sizes: ['1300', '2600'],
  },
  {
    key: 'boneless-makhan-handi',
    name: 'Chicken Boneless Makhan Handi',
    nameUr: 'چکن بون لیس مکھن ہانڈی',
    description: 'Boneless chicken in a silky butter-and-tomato makhni gravy, finished with cream in the handi.',
    category: 'chicken-boneless-karahi',
    image: '/photos/boneless-makhan-handi.jpg',
    sizes: ['1300', '2600'],
  },
  {
    key: 'boneless-lemon-chaska-karahi',
    name: 'Chicken Boneless Lemon Chaska Karahi',
    nameUr: 'چکن بون لیس لیموں چسکا کراہی',
    description: 'Boneless white karahi finished at the pass with lemon and the house chaska seasoning.',
    category: 'chicken-boneless-karahi',
    image: '/photos/boneless-lemon-chaska-karahi.jpg',
    sizes: ['1300', '2600'],
  },

  // ── Mutton Karahi ───────────────────────────────────────────────────────────
  {
    key: 'mutton-shahi-karahi',
    name: 'Mutton Shahi Karahi',
    nameUr: 'مٹن شاہی کراہی',
    description: 'Bone-in mutton in a rich shahi masala with fresh cream, ginger and green chilli.',
    category: 'mutton-karahi',
    image: '/photos/mutton-shahi-karahi.jpg',
    sizes: ['2100', '4200'],
  },
  {
    key: 'mutton-badshahi-karahi',
    name: 'Mutton Badshahi Karahi',
    nameUr: 'مٹن بادشاہی کراہی',
    description: 'Bone-in mutton slow-cooked in a dark, deep-spiced badshahi masala with crisp onion.',
    category: 'mutton-karahi',
    image: '/photos/mutton-badshahi-karahi.jpg',
    sizes: ['2100', '4200'],
  },
  {
    key: 'mutton-green-karahi',
    name: 'Mutton Green Karahi',
    nameUr: 'مٹن سبز کراہی',
    description: 'Bone-in mutton in a fresh coriander and mint green masala — light and herby.',
    category: 'mutton-karahi',
    image: '/photos/mutton-green-karahi.jpg',
    sizes: ['2100', '4200'],
  },
  {
    key: 'mutton-brown-karahi',
    name: 'Mutton Brown Karahi',
    nameUr: 'مٹن بھورا کراہی',
    description: 'Bone-in mutton in a classic well-reduced brown tomato, ginger and black-pepper masala.',
    category: 'mutton-karahi',
    image: '/photos/mutton-brown-karahi.jpg',
    sizes: ['2100', '4200'],
  },
  {
    key: 'mutton-white-karahi',
    name: 'Mutton White Karahi',
    nameUr: 'مٹن سفید کراہی',
    description: 'Bone-in mutton in a mild white cream karahi with cracked black pepper, cooked without tomato.',
    category: 'mutton-karahi',
    image: '/photos/mutton-white-karahi.jpg',
    sizes: ['2200', '4400'],
  },
  {
    key: 'mutton-malai-white-karahi',
    name: 'Mutton Malai White Karahi',
    nameUr: 'مٹن ملائی سفید کراہی',
    description: 'Bone-in mutton in a soft malai masala — cream, butter and white pepper, no chilli heat.',
    category: 'mutton-karahi',
    image: '/photos/mutton-malai-white-karahi.jpg',
    sizes: ['2200', '4400'],
  },
  {
    key: 'mutton-lemon-chaska-white-karahi',
    name: 'Mutton Lemon Chaska White Karahi',
    nameUr: 'مٹن لیموں چسکا سفید کراہی',
    description: 'Mutton white karahi finished at the pass with lemon and the house chaska seasoning.',
    category: 'mutton-karahi',
    image: '/photos/mutton-lemon-chaska-white-karahi.jpg',
    sizes: ['2200', '4400'],
  },

  // ── Chaska Special ──────────────────────────────────────────────────────────
  {
    key: 'balochi-tikka',
    name: 'Balochi Tikka',
    nameUr: 'بلوچی تکہ',
    description: 'Coarse-minced chicken and lamb tikka with dried plum and Balochi masala, char-grilled on skewers.',
    category: 'chaska-special',
    image: '/photos/balochi-tikka.jpg',
    sizes: ['1100', '2200'],
  },
  {
    key: 'beef-karahi',
    name: 'Beef Karahi',
    nameUr: 'بیف کراہی',
    description: 'Bone-in beef slow-cooked in a rich tomato, ginger and green-chilli karahi masala over coal.',
    category: 'chaska-special',
    image: '/photos/beef-karahi.jpg',
    sizes: ['1800', '3600'],
  },
  {
    key: 'keema-karahi',
    name: 'Keema Karahi',
    nameUr: 'قیمہ کراہی',
    description: 'Minced meat karahi with tomato, ginger, green chilli and fresh coriander, cooked to order.',
    category: 'chaska-special',
    image: '/photos/keema-karahi.jpg',
    sizes: ['1200', '2400'],
  },
];

export const CHASKA_EXTRAS: ChaskaExtra[] = [
  {
    slug: 'sada-naan',
    name: 'Sada Naan',
    nameUr: 'سادہ نان',
    description: 'Plain tandoori naan, baked to order.',
    price: '30',
    image: '/photos/sada-naan.jpg',
  },
  {
    slug: 'garlic-naan',
    name: 'Garlic Naan',
    nameUr: 'لہسن نان',
    description: 'Tandoori naan with garlic and butter.',
    price: '50',
    image: '/photos/garlic-naan.jpg',
  },
  {
    slug: 'kulcha-naan',
    name: 'Kulcha Naan',
    nameUr: 'کلچہ نان',
    description: 'Leavened tandoori kulcha.',
    price: '40',
    image: '/photos/kulcha-naan.jpg',
  },
  {
    slug: 'chapati',
    name: 'Chapati',
    nameUr: 'چپاتی',
    description: 'Wholewheat chapati, baked fresh.',
    price: '20',
    image: '/photos/chapati.jpg',
  },
  {
    slug: 'salad',
    name: 'Salad',
    nameUr: 'سلاد',
    description: 'Seasonal salad with lemon and black salt.',
    price: '70',
    image: '/photos/salad.jpg',
  },
  {
    slug: 'raita',
    name: 'Raita',
    nameUr: 'رائتہ',
    description: 'Whipped yoghurt with cucumber, mint and roasted cumin.',
    price: '80',
    image: '/photos/raita.jpg',
  },
  {
    slug: 'cold-drink',
    name: 'Cold Drink',
    nameUr: 'کولڈ ڈرنک',
    description: 'Chilled carbonated drink, bottle straight from the cooler.',
    price: '90',
    image: '/photos/cold-drink.jpg',
  },
  {
    slug: 'mineral-water-small',
    name: 'Mineral Water Small',
    nameUr: 'منرل واٹر چھوٹا',
    description: 'Sealed small bottle of still mineral water.',
    price: '60',
    image: '/photos/mineral-water-small.jpg',
  },
  {
    slug: 'mineral-water-large',
    name: 'Mineral Water Large',
    nameUr: 'منرل واٹر بڑا',
    description: 'Sealed large bottle of still mineral water.',
    price: '120',
    image: '/photos/mineral-water-large.jpg',
  },
];
/** One expanded `products` row — a single size of a dish, or a whole extra. */
export type ChaskaMenuRow = {
  slug: string;
  name: string;
  nameUr: string;
  sizeLabel: string | null;
  groupKey: string | null;
  description: string;
  price: string;
  category: string;
  image: string;
  sortOrder: number;
};

const SIZE_LABELS = ['Half', 'Full'] as const;

/**
 * Dishes first, extras second, each in the owner's listed order. The size suffix
 * is part of the slug so the pair never collides with the old single-price rows.
 */
export const CHASKA_MENU_ROWS: ChaskaMenuRow[] = [
  ...CHASKA_DISHES.flatMap((dish, dishIndex) =>
    dish.sizes.map((price, sizeIndex) => ({
      slug: `${dish.key}-${SIZE_LABELS[sizeIndex].toLowerCase()}`,
      name: dish.name,
      nameUr: dish.nameUr,
      sizeLabel: SIZE_LABELS[sizeIndex],
      groupKey: dish.key,
      description: dish.description,
      price,
      category: dish.category,
      image: dish.image,
      sortOrder: dishIndex * 10 + sizeIndex,
    })),
  ),
  ...CHASKA_EXTRAS.map((extra, index) => ({
    slug: extra.slug,
    name: extra.name,
    nameUr: extra.nameUr,
    sizeLabel: null,
    groupKey: null,
    description: extra.description,
    price: extra.price,
    category: 'extras',
    image: extra.image,
    sortOrder: index,
  })),
];

/** Every photograph the catalogue expects under `public/photos/`. */
export const CHASKA_IMAGE_PATHS: string[] = [
  ...new Set(CHASKA_MENU_ROWS.map((row) => row.image).filter((image) => image !== '')),
];
