export type ID = string;

export interface Company {
  id: ID;
  name: string;
  createdAt: number;
}

export interface Category {
  id: ID;
  name: string;
  // Kitchen/Bathroom tiles have variants L/H1/H2/H3/D/F, others have a single total
  hasVariants: boolean;
  createdAt: number;
}

export const VARIANT_KEYS = ["L", "H1", "H2", "H3", "D", "F"] as const;
export type VariantKey = typeof VARIANT_KEYS[number];

export type VariantStock = Record<VariantKey, number>;

export interface Product {
  id: ID;
  companyId: ID;
  categoryId: ID;
  size: string;
  model: string;
  photo?: string; // base64 data URI
  minStock: number;
  // Either variants (kitchen/bathroom tile) OR total
  variants?: VariantStock;
  total?: number;
  createdAt: number;
  updatedAt: number;
}

export type StockOp = "add" | "reduce";

export interface StockHistoryEntry {
  id: ID;
  productId: ID;
  type: StockOp;
  variant?: VariantKey; // for variant products
  quantity: number;
  reason: string;
  previous: number;
  current: number;
  timestamp: number;
  note?: string;
}

export interface ActivityLogEntry {
  id: ID;
  action: string;
  details: string;
  timestamp: number;
}

export interface Settings {
  theme: "light" | "dark" | "system";
  defaultMinStock: number;
  ownerName: string;
}

export const ADD_REASONS = [
  "New Load",
  "Company Supply",
  "Godown Transfer",
  "Stock Correction",
  "Other",
];

export const REDUCE_REASONS = [
  "Sold",
  "Damaged",
  "Broken",
  "Returned",
  "Sample",
  "Stock Adjustment",
  "Other",
];
