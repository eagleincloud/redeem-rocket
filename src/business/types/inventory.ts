/**
 * Inventory Management Types
 * Complete type definitions for the inventory management system
 */

// ── Product Inventory Extended ──────────────────────────────────────────────────

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  mrp: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  warehouseLocation?: string;
  supplierId?: string;
  image?: string;
  emoji?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Inventory Transaction Type ──────────────────────────────────────────────────

export type InventoryTransactionType = 'in' | 'out' | 'adjustment';
export type TransactionReason =
  | 'purchase'
  | 'sale'
  | 'return'
  | 'damage'
  | 'loss'
  | 'inventory_adjustment'
  | 'warehouse_transfer'
  | 'quality_check';

export interface InventoryTransaction {
  id: string;
  businessId: string;
  productId: string;
  type: InventoryTransactionType;
  quantity: number;
  reason: TransactionReason;
  reference?: string;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Stock Level Type ───────────────────────────────────────────────────────────

export interface StockLevel {
  productId: string;
  businessId: string;
  available: number;
  reserved: number;
  damaged: number;
  quantityOnHand: number;
  lastCountDate?: Date;
  updatedAt: Date;
}

// ── Dashboard KPI Types ────────────────────────────────────────────────────────

export interface InventoryKPIs {
  totalSKUs: number;
  lowStockItems: number;
  stockValue: number;
  inventoryTurnover: number;
  stockAccuracy: number;
  warehouseUtilization: number;
  averageDaysToRestock: number;
  lastUpdateTime: Date;
}

// ── Error Types ────────────────────────────────────────────────────────────────

export class InventoryError extends Error {
  constructor(message: string, public code: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'InventoryError';
  }
}
