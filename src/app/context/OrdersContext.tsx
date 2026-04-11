import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import type { Order } from '../types';

const STORAGE_KEY = 'redeem-rocket-orders';

export interface OrdersContextValue {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'redeemed'>) => Order;
  setOrderRedeemed: (orderId: string, redeemed: boolean) => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

function loadOrders(): Order[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((o: Order) => ({ ...o, createdAt: new Date(o.createdAt), redeemed: o.redeemed ?? false }))
      : [];
  } catch {
    return [];
  }
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(loadOrders);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  const addOrder = useCallback((order: Omit<Order, 'id' | 'createdAt' | 'redeemed'>) => {
    const newOrder: Order = {
      ...order,
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date(),
      redeemed: false,
    };
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, []);

  const setOrderRedeemed = useCallback((orderId: string, redeemed: boolean) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, redeemed } : o)));
  }, []);

  const value = useMemo(() => ({ orders, addOrder, setOrderRedeemed }), [orders, addOrder, setOrderRedeemed]);

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
