'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast';
import { toCents } from '@/lib/money';

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: string;
  imageUrl: string;
  quantity: number;
  /** Per-item kitchen note, e.g. "extra green chilli". Sent to the order line. */
  notes?: string;
};

/** How the customer intends to get the food. The header sets it first and checkout can still change it. */
export type Fulfilment = 'delivery' | 'pickup';

/** What the opening popup collects: the order type plus the place it is going. */
export type FulfilmentChoice = { mode: Fulfilment; city: string; area: string };

type CartValue = {
  lines: CartLine[];
  count: number;
  subtotalCents: number;
  isOpen: boolean;
  /** Promo code typed or clicked by the customer. The server re-validates it. */
  coupon: string;
  /** Delivery area picked in the header; prefills the checkout address. */
  area: string;
  mode: Fulfilment;
  /** False until localStorage has been read, so nothing flashes before the stored answer. */
  isHydrated: boolean;
  /** Null until the customer answers the Delivery / Pick-Up popup. */
  choice: FulfilmentChoice | null;
  /** False while `choice` is null, or when delivery was picked without an area. */
  canOrder: boolean;
  isGateOpen: boolean;
  add: (product: Omit<CartLine, 'quantity'>, quantity?: number) => boolean;
  setQuantity: (productId: string, quantity: number) => void;
  setNotes: (productId: string, notes: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  setCoupon: (code: string) => void;
  setArea: (area: string) => void;
  setMode: (mode: Fulfilment) => void;
  confirmFulfilment: (choice: FulfilmentChoice) => void;
  openGate: () => void;
  closeGate: () => void;
};

// Keys are historical; renaming them would silently empty live carts.
const STORAGE_KEY = 'loop-cart-v1';
const COUPON_KEY = 'loop-coupon-v1';
const AREA_KEY = 'loop-area-v1';
const MODE_KEY = 'chaska.fulfilment-v1';
/** The popup's answer, kept apart from MODE_KEY so old carts keep their mode reading as-is. */
const CHOICE_KEY = 'chaska.fulfilment-choice-v1';
const MAX_LINES = 30;
const MAX_QTY = 30;
const CartContext = createContext<CartValue | null>(null);

function clampQuantity(value: number): number {
  return Math.min(Math.max(1, Math.trunc(value) || 1), MAX_QTY);
}

function readStored(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((line): line is CartLine => {
        const value = line as Partial<CartLine>;
        return typeof value.productId === 'string' && typeof value.price === 'string' && typeof value.quantity === 'number';
      })
      .map((line) => ({ ...line, quantity: clampQuantity(line.quantity), notes: line.notes?.slice(0, 200) }))
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

function readText(key: string, limit: number): string {
  if (typeof window === 'undefined') return '';
  return (window.localStorage.getItem(key) ?? '').slice(0, limit);
}

function readChoice(): FulfilmentChoice | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CHOICE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    const value = parsed as Partial<FulfilmentChoice>;
    if (value?.mode !== 'delivery' && value?.mode !== 'pickup') return null;
    return { mode: value.mode, city: value.city ?? '', area: value.area ?? '' };
  } catch {
    return null;
  }
}

/** True on the layouts where the cart has no permanent panel, so the drawer is the only surface. */
function cartNeedsDrawer() {
  return typeof window !== 'undefined' && !window.matchMedia('(min-width: 1024px)').matches;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [coupon, setCouponState] = useState('');
  const [area, setAreaState] = useState('');
  const [mode, setModeState] = useState<Fulfilment>('delivery');
  const [choice, setChoice] = useState<FulfilmentChoice | null>(null);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readChoice();
    setLines(readStored());
    setCouponState(readText(COUPON_KEY, 30));
    setChoice(stored);
    const storedMode = stored?.mode ?? (window.localStorage.getItem(MODE_KEY) === 'pickup' ? 'pickup' : 'delivery');
    setModeState(storedMode);
    setAreaState(stored?.area ?? readText(AREA_KEY, 80));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (coupon.length === 0) window.localStorage.removeItem(COUPON_KEY);
    else window.localStorage.setItem(COUPON_KEY, coupon);
  }, [coupon, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (area.length === 0) window.localStorage.removeItem(AREA_KEY);
    else window.localStorage.setItem(AREA_KEY, area);
  }, [area, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    // Delivery is the default, so only the deliberate pickup choice is stored.
    if (mode === 'pickup') window.localStorage.setItem(MODE_KEY, 'pickup');
    else window.localStorage.removeItem(MODE_KEY);
  }, [mode, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (choice === null) window.localStorage.removeItem(CHOICE_KEY);
    else window.localStorage.setItem(CHOICE_KEY, JSON.stringify(choice));
  }, [choice, hydrated]);

  const canOrder = choice !== null && (choice.mode === 'pickup' || choice.area.trim().length > 0);

  // The header picker edits mode and area directly, so an answered popup keeps tracking those edits.
  const setArea = useCallback((next: string) => {
    const value = next.slice(0, 80);
    setAreaState(value);
    setChoice((current) => (current === null ? current : { ...current, area: value }));
  }, []);

  const setMode = useCallback((next: Fulfilment) => {
    setModeState(next);
    setChoice((current) => (current === null ? current : { ...current, mode: next }));
  }, []);

  const confirmFulfilment = useCallback((next: FulfilmentChoice) => {
    setChoice({ ...next, area: next.area.slice(0, 80) });
    setModeState(next.mode);
    setAreaState(next.area.slice(0, 80));
    setIsGateOpen(false);
  }, []);

  const add = useCallback(
    (product: Omit<CartLine, 'quantity'>, quantity = 1) => {
      // Ordering is only open once the popup has been answered, so an unasked customer is
      // taken to the question instead of losing the dish they just tapped.
      if (!canOrder) {
        toast('Choose delivery or pickup first');
        setIsGateOpen(true);
        return false;
      }
      const note = product.notes?.trim();
      const payload = { ...product, notes: note && note.length > 0 ? note.slice(0, 200) : undefined };
      setLines((current) => {
        const existing = current.find((line) => line.productId === product.productId);
        if (existing) {
          return current.map((line) =>
            line.productId === product.productId
              ? { ...line, quantity: Math.min(line.quantity + clampQuantity(quantity), MAX_QTY), notes: payload.notes ?? line.notes }
              : line,
          );
        }
        return [...current, { ...payload, quantity: clampQuantity(quantity) }].slice(-MAX_LINES);
      });
      toast(`${payload.name} added to your cart`);
      // On desktop the cart sits beside the dishes, so a drawer over it is a nuisance.
      if (cartNeedsDrawer()) setIsOpen(true);
      return true;
    },
    [toast, canOrder],
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) => (line.productId === productId ? { ...line, quantity: Math.min(quantity, MAX_QTY) } : line)),
    );
  }, []);

  const setNotes = useCallback((productId: string, notes: string) => {
    const trimmed = notes.slice(0, 200);
    setLines((current) =>
      current.map((line) => (line.productId === productId ? { ...line, notes: trimmed.length > 0 ? trimmed : undefined } : line)),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const value = useMemo<CartValue>(() => {
    const subtotalCents = lines.reduce((total, line) => total + toCents(line.price) * line.quantity, 0);
    return {
      lines,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      subtotalCents,
      isOpen,
      coupon,
      area,
      mode,
      isHydrated: hydrated,
      choice,
      canOrder,
      isGateOpen,
      add,
      setQuantity,
      setNotes,
      remove,
      clear: () => setLines([]),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      setCoupon: (code) => setCouponState(code.trim().toUpperCase().slice(0, 30)),
      setArea,
      setMode,
      confirmFulfilment,
      openGate: () => setIsGateOpen(true),
      closeGate: () => setIsGateOpen(false),
    };
  }, [lines, isOpen, coupon, area, mode, hydrated, choice, canOrder, isGateOpen, add, setQuantity, setNotes, remove, setArea, setMode, confirmFulfilment]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
