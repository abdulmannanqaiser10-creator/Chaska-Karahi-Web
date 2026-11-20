'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon } from 'lucide-react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

type Toast = { id: number; message: string };

/** The default is a silent no-op so a stray `useToast` outside the provider cannot crash a page. */
const ToastContext = createContext<(message: string) => void>(() => {});

const LIFETIME_MS = 2_600;

/**
 * One transient message at a time, newest wins. Used for "added to cart" feedback so
 * the drawer does not have to interrupt the page on wide screens where the cart is
 * already visible.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback((message: string) => {
    seq.current += 1;
    const id = seq.current;
    setToasts([{ id, message }]);
    window.setTimeout(() => setToasts((current) => (current.some((t) => t.id === id) ? [] : current)), LIFETIME_MS);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 sm:justify-end sm:pr-6">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.p
              key={toast.id}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              role="status"
              aria-live="polite"
              className="pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-full border border-accent-deep/25 bg-charcoal/95 py-2.5 pl-3 pr-5 text-sm font-medium text-paper shadow-premium backdrop-blur"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold text-charcoal">
                <CheckIcon size={14} strokeWidth={3} aria-hidden />
              </span>
              {toast.message}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
