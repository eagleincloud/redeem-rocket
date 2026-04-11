import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import type { WalletTransaction } from '../types';
import { mockTransactions } from '../mockData';
import { fetchWalletTransactions } from '../api/supabase-data';
import { hasSupabase } from '../lib/supabase';

const STORAGE_KEY = 'redeem-rocket-wallet-transactions';

export interface WalletContextValue {
  transactions: WalletTransaction[];
  /** Active balance: sum of non-expired credits minus payments. Use this everywhere instead of raw balance. */
  balance: number;
  addTransaction: (tx: Omit<WalletTransaction, 'id' | 'createdAt'>) => WalletTransaction;
  /** Returns cashback transactions expiring within the given number of days */
  getExpiringTransactions: (withinDays: number) => WalletTransaction[];
}

const WalletContext = createContext<WalletContextValue | null>(null);

function loadLocalTransactions(): WalletTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((t: WalletTransaction) => ({ ...t, createdAt: new Date(t.createdAt) }))
      : [];
  } catch {
    return [];
  }
}

function saveTransactions(transactions: WalletTransaction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function isExpired(tx: WalletTransaction): boolean {
  if (!tx.expiry_date) return false;
  return new Date(tx.expiry_date).getTime() < Date.now();
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    const local = loadLocalTransactions();
    if (local.length > 0) return local;
    return mockTransactions.map((t) => ({ ...t, createdAt: new Date(t.createdAt) }));
  });
  const [loadedFromSupabase, setLoadedFromSupabase] = useState(false);

  useEffect(() => {
    if (!hasSupabase() || loadedFromSupabase) return;
    setLoadedFromSupabase(true);
    fetchWalletTransactions()
      .then((list) => {
        if (list.length > 0) {
          const local = loadLocalTransactions();
          const localOnly = local.filter((t) => t.id.startsWith('tx-'));
          const merged = [...list, ...localOnly].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setTransactions(merged);
        }
      })
      .catch(() => {});
  }, [loadedFromSupabase]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  const addTransaction = useCallback((tx: Omit<WalletTransaction, 'id' | 'createdAt'>) => {
    const now = new Date();
    const expiry = tx.amount > 0 && tx.type === 'cashback'
      ? new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : undefined;
    const newTx: WalletTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: now,
      expiry_date: tx.expiry_date ?? expiry,
    };
    setTransactions((prev) => [newTx, ...prev]);
    return newTx;
  }, []);

  /** Active balance: non-expired credits + payments/refunds */
  const balance = useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (t.amount > 0 && isExpired(t)) return sum; // skip expired credits
      return sum + t.amount;
    }, 0);
  }, [transactions]);

  const getExpiringTransactions = useCallback((withinDays: number): WalletTransaction[] => {
    const cutoff = Date.now() + withinDays * 24 * 60 * 60 * 1000;
    return transactions.filter((t) => {
      if (!t.expiry_date || t.amount <= 0) return false;
      if (isExpired(t)) return false;
      return new Date(t.expiry_date).getTime() <= cutoff;
    });
  }, [transactions]);

  const value = useMemo(
    () => ({ transactions, balance, addTransaction, getExpiringTransactions }),
    [transactions, balance, addTransaction, getExpiringTransactions]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
