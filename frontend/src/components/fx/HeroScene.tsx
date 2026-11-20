'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/components/cn';

type Particle = { x: number; y: number; r: number; vx: number; vy: number; alpha: number; wobble: number };

/**
 * Decorative hero layer: a soft gold bokeh field on canvas plus two slow-turning
 * rings in CSS 3D. The sprite is pre-rendered once so each frame is a drawImage,
 * and the loop parks itself while the hero is off-screen or the tab is hidden.
 */
export function HeroScene({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
    const sprite = document.createElement('canvas');
    const size = 64;
    sprite.width = size;
    sprite.height = size;
    const sctx = sprite.getContext('2d');
    if (!sctx) return;
    const grad = sctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(214, 36, 46, 0.85)');
    grad.addColorStop(0.35, 'rgba(201, 138, 61, 0.34)');
    grad.addColorStop(1, 'rgba(201, 138, 61, 0)');
    sctx.fillStyle = grad;
    sctx.beginPath();
    sctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    sctx.fill();

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let raf = 0;
    let visible = true;

    const spawn = (fresh: boolean): Particle => ({
      x: Math.random() * width,
      y: fresh ? Math.random() * height : height + 20,
      r: 3 + Math.random() * 16,
      vx: (Math.random() - 0.5) * 0.16,
      vy: -(0.1 + Math.random() * 0.34),
      alpha: 0.1 + Math.random() * 0.22,
      wobble: Math.random() * Math.PI * 2,
    });

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.globalAlpha = p.alpha;
        ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      for (const p of particles) {
        p.wobble += 0.008;
        p.x += p.vx + Math.sin(p.wobble) * 0.22;
        p.y += p.vy;
        if (p.y < -30 || p.x < -40 || p.x > width + 40) Object.assign(p, spawn(false));
      }
      draw();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (reduce || raf || !visible) return;
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!raf) return;
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(44, Math.max(14, (width * height) / 30000)));
      particles = Array.from({ length: count }, () => spawn(true));
      draw();
    };

    resize();
    if (!reduce) start();

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });
    observer.observe(parent);

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" />
      <div className="absolute right-[12%] top-[14%] hidden h-[19rem] w-[19rem] lg:block">
        <div className="spin-slow absolute inset-0 rounded-full border border-accent/16" />
        <div className="absolute inset-6 breathe rounded-full border border-dashed border-accent/22" />
        <div className="absolute inset-16 rounded-full border border-accent/10" />
      </div>
      <div className="absolute -left-10 bottom-[8%] h-40 w-40 float-slow rounded-full bg-accent/10 blur-2xl" />
    </div>
  );
}
