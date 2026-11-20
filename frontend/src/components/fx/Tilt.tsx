'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/components/cn';

const MAX_TILT = 7;

/**
 * Pointer-driven 3D tilt. Only attaches on hover-capable, fine-pointer devices and
 * never runs when the visitor asks for reduced motion, so touch layouts stay flat.
 */
export function Tilt({
  className,
  children,
  lift = 8,
}: {
  className?: string;
  children: ReactNode;
  lift?: number;
}) {
  const node = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);

  const write = useCallback((x: number, y: number, tiltX: number, tiltY: number, raised: number) => {
    const style = node.current?.style;
    if (!style) return;
    style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
    style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
    style.setProperty('--sheen-x', `${x.toFixed(1)}%`);
    style.setProperty('--sheen-y', `${y.toFixed(1)}%`);
    style.setProperty('--tilt-lift', `${raised}px`);
  }, []);

  useEffect(() => {
    const el = node.current;
    if (!el) return;
    if (typeof window.matchMedia === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const reset = () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      write(50, 0, 0, 0, 0);
    };

    const onMove = (event: PointerEvent) => {
      if (frame.current !== null) return;
      const { clientX, clientY } = event;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        write(x, y, (0.5 - y / 100) * MAX_TILT * 2, ((x - 0.5 * 100) / 100) * MAX_TILT * 2, -lift);
      });
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', reset);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', reset);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [lift, write]);

  return (
    <div ref={node} className={cn('tilt tilt-sheen', className)}>
      {children}
    </div>
  );
}
