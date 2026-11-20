'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/components/cn';

/**
 * Scroll parallax for decorative layers only — it transforms a wrapper, never content
 * that carries text, so type stays crisp. Skipped on touch and reduced-motion.
 */
export function Parallax({
  speed = 0.12,
  className,
  children,
}: {
  speed?: number;
  className?: string;
  children: ReactNode;
}) {
  const node = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = node.current;
    if (!el) return;
    if (typeof window.matchMedia === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(hover: none)').matches) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;
      const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * -speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [speed]);

  return (
    <div ref={node} className={cn('will-change-transform', className)}>
      {children}
    </div>
  );
}
