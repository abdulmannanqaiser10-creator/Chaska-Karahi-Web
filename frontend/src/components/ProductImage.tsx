import Image from 'next/image';
import { cn } from './cn';

function isRemote(src: string) {
  return /^https?:\/\//i.test(src) || src.startsWith('//');
}

export function ProductImage({
  src,
  alt,
  className,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  priority = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className={cn('flex items-center justify-center bg-surface-2 text-xs text-muted', className)}>
        No image
      </div>
    );
  }

  // Admins may paste any absolute URL into the product image field. next/image
  // throws at render time for unconfigured remote hostnames, which would blank
  // out every card that shows the product — so remote sources skip the optimizer.
  if (isRemote(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary admin-supplied host
      <img
        src={src}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn('object-cover', className)}
    />
  );
}
