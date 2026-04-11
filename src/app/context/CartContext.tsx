import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { CartItem, Product, Offer } from '../types';

export interface CartContextValue {
  items: CartItem[];
  addProduct: (product: Product, businessName: string, quantity?: number) => void;
  addOffer: (offer: Offer, businessName: string, quantity?: number) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addProduct = useCallback((product: Product, businessName: string, quantity = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((x) => x.product?.id === product.id);
      if (i >= 0) {
        const next = [...prev];
        next[i].quantity += quantity;
        return next;
      }
      return [...prev, { product, businessId: product.businessId, businessName, name: product.name, price: product.price, quantity }];
    });
  }, []);

  const addOffer = useCallback((offer: Offer, businessName: string, quantity = 1) => {
    const price = offer.price ?? 0;
    setItems((prev) => {
      const i = prev.findIndex((x) => x.offer?.id === offer.id);
      if (i >= 0) {
        const next = [...prev];
        next[i].quantity += quantity;
        return next;
      }
      return [...prev, { offer, businessId: offer.businessId, businessName, name: offer.title, price, quantity }];
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity };
      return next;
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, addProduct, addOffer, removeItem, updateQuantity, clearCart, total }),
    [items, addProduct, addOffer, removeItem, updateQuantity, clearCart, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
