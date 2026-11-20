import Link from 'next/link';

/**
 * Chaska Koyla Karahi identity, redrawn from the shop's own signboard: a gold cloche
 * resting in an open hand on a black plate, ringed in gold. Vector so the same mark
 * holds up as a 16px favicon and as the login hero, and so the black-and-gold of the
 * signboard never depends on a raster that has to be re-exported for every surface.
 */
export function LogoMark({
  size = 40,
  className = '',
  gradientId = 'chaska-gold',
}: {
  size?: number;
  className?: string;
  gradientId?: string;
}) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id={gradientId} x1="10" y1="4" x2="54" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F8DE8B" />
          <stop offset="0.4" stopColor="#DDAE3E" />
          <stop offset="0.72" stopColor="#BC882A" />
          <stop offset="1" stopColor="#82570F" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="14" fill="#0C0C0E" />
      <rect x="1.4" y="1.4" width="61.2" height="61.2" rx="12.8" fill="none" stroke={`url(#${gradientId})`} strokeOpacity="0.55" strokeWidth="1.4" />

      <g fill={`url(#${gradientId})`}>
        <circle cx="32" cy="7.4" r="2.6" />
        <rect x="30.6" y="8.8" width="2.8" height="4.6" rx="1.4" />
        <path d="M32 12.6c-9.7 0-17.7 7-18.6 15.8h37.2C49.7 19.6 41.7 12.6 32 12.6z" />
        <rect x="10.6" y="28" width="42.8" height="4.8" rx="2.4" />

        <rect x="25" y="36.6" width="25" height="4.6" rx="2.3" />
        <rect x="25" y="41.8" width="21.5" height="4.6" rx="2.3" />
        <rect x="25" y="47" width="17" height="4.6" rx="2.3" />
        <rect x="15.4" y="36.2" width="14.5" height="15.8" rx="6.4" />
        <rect x="14.2" y="29.4" width="5.4" height="12" rx="2.7" transform="rotate(-20 16.9 35.4)" />
        <rect x="4.6" y="43.4" width="13" height="6.4" rx="3.2" transform="rotate(-14 11.1 46.6)" />
      </g>
    </svg>
  );
}

export function Logo({
  href = '/',
  size = 'md',
  withCaption = true,
  tone = 'dark',
  className = '',
}: {
  href?: string | null;
  size?: 'sm' | 'md' | 'lg';
  withCaption?: boolean;
  /** `light` is for the dark header and footer bands. */
  tone?: 'dark' | 'light';
  className?: string;
}) {
  const mark = size === 'lg' ? 56 : size === 'sm' ? 34 : 44;
  const wordmark = size === 'lg' ? 'text-[2rem]' : size === 'sm' ? 'text-[1.25rem]' : 'text-[1.55rem]';
  const subline = size === 'lg' ? 'text-[1.05rem]' : 'text-[0.85rem]';
  const caption = size === 'lg' ? 'text-[0.62rem] tracking-[0.3em]' : 'text-[9px] tracking-[0.24em]';
  const showSubline = size !== 'sm';
  const showCaption = withCaption && size !== 'sm';

  /* The signboard sets the name in gold on black, so the wordmark follows the plate on
     dark bands and drops to gold-ink on cream and white, where #ffbd45 is unreadable. */
  const gold = tone === 'light' ? 'text-gold' : 'text-gold-ink';
  const faint = tone === 'light' ? 'text-paper/60' : 'text-muted';

  /* Noto Nastaliq Urdu is drawn on a slant that leaves its line box twice the ink height —
     at leading-none the tail of the wordmark lands on the subline under it. The Urdu lines
     carry their own spacing, so only the Latin caption needs a margin. */
  const body = (
    <span className={`inline-flex items-center gap-2.5 whitespace-nowrap ${className}`}>
      <LogoMark size={mark} />
      <span className="flex flex-col items-start justify-center">
        <span lang="ur" dir="rtl" className={`${wordmark} leading-[1.75] font-urdu font-bold ${gold}`}>
          چسکا
        </span>
        {showSubline ? (
          <span lang="ur" dir="rtl" className={`${subline} leading-[1.75] font-urdu ${gold}`}>
            کوئلہ کڑاہی
          </span>
        ) : null}
        {showCaption ? (
          <span className={`${caption} mt-1 font-heading font-semibold uppercase leading-none ${faint}`}>
            Chaska Koyla Karahi
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) return body;
  return (
    <Link href={href} aria-label="Chaska Koyla Karahi home" className="inline-flex transition-opacity hover:opacity-90">
      {body}
    </Link>
  );
}
