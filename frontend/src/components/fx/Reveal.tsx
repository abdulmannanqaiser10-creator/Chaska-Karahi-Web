'use client';

import { useCallback, useRef, type CSSProperties, type ElementType, type ReactNode } from 'react';
import { cn } from '@/components/cn';

/**
 * One shared IntersectionObserver for the whole page: each [data-reveal] element is
 * released once and then forgotten, so long menus do not accumulate observers.
 *
 * Content that is already on screen (or near it) is revealed immediately. A short
 * safety timeout also forces visibility so a missed observer callback can never leave
 * a blank hole where food cards or sections should be.
 */
let observer: IntersectionObserver | null = null;

function getObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return null;
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          observer?.unobserve(entry.target);
        }
      },
      // Positive bottom margin reveals cards just below the fold; avoid a negative
      // inset that can leave sticky-header pages permanently invisible on phones.
      { rootMargin: '120px 0px 120px 0px', threshold: 0.01 },
    );
  }
  return observer;
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

function isNearViewport(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
  return rect.bottom >= -80 && rect.top <= viewportHeight + 160 && rect.right >= 0 && rect.left <= viewportWidth;
}

/** Scroll-triggered reveal. `delay` staggers siblings without a class per position. */
export function Reveal({
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  className,
  children,
}: {
  as?: ElementType;
  variant?: 'up' | 'left' | 'right' | 'scale';
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const attached = useRef<HTMLElement | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setNode = useCallback((node: HTMLElement | null) => {
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
    if (attached.current && attached.current !== node) {
      getObserver()?.unobserve(attached.current);
    }
    attached.current = node;
    if (!node) return;

    const reveal = () => {
      node.classList.add('is-in');
      getObserver()?.unobserve(node);
      if (safetyTimer.current) {
        clearTimeout(safetyTimer.current);
        safetyTimer.current = null;
      }
    };

    if (prefersReducedMotion()) {
      reveal();
      return;
    }

    // Already painted in (or near) the viewport — do not wait for a scroll event.
    if (isNearViewport(node)) {
      reveal();
      return;
    }

    const live = getObserver();
    if (!live) {
      reveal();
      return;
    }

    live.observe(node);
    // Hard fallback: never leave catalogue content invisible on any device.
    safetyTimer.current = setTimeout(reveal, 450);
  }, []);

  return (
    <Tag ref={setNode} data-reveal={variant} style={{ '--reveal-delay': `${delay}ms` } as CSSProperties} className={cn(className)}>
      {children}
    </Tag>
  );
}
