import { storage } from "@/src/utils/storage";
import {
  ActivityLogEntry,
  Category,
  Company,
  ID,
  Product,
  Settings,
  StockHistoryEntry,
  VARIANT_KEYS,
  VariantKey,
} from "./types";

// Storage keys
const K = {
  companies: "svt.companies",
  categories: "svt.categories",
  products: "svt.products",
  history: "svt.history",
  activity: "svt.activity",
  settings: "svt.settings",
  seeded: "svt.seeded",
  pinSet: "svt.pinSet",
};

const PIN_KEY = "svt.pin";

// Generic list helpers — storage util stores scalars only, so we JSON.stringify complex objects.
async function readList<T>(key: string): Promise<T[]> {
  const raw = (await storage.getItem(key, "")) as string;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeList<T>(key: string, items: T[]): Promise<void> {
  await storage.setItem(key, JSON.stringify(items));
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// --- Companies ---
export async function getCompanies(): Promise<Company[]> {
  return readList<Company>(K.companies);
}
export async function saveCompanies(list: Company[]) {
  await writeList(K.companies, list);
}
export async function addCompany(name: string): Promise<Company> {
  const list = await getCompanies();
  const co: Company = { id: newId(), name: name.trim(), createdAt: Date.now() };
  list.push(co);
  await saveCompanies(list);
  return co;
}
export async function updateCompany(id: ID, name: string) {
  const list = await getCompanies();
  const idx = list.findIndex((c) => c.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], name: name.trim() };
    await saveCompanies(list);
  }
}
export async function deleteCompany(id: ID) {
  const list = (await getCompanies()).filter((c) => c.id !== id);
  await saveCompanies(list);
}

// --- Categories ---
export async function getCategories(): Promise<Category[]> {
  return readList<Category>(K.categories);
}
export async function saveCategories(list: Category[]) {
  await writeList(K.categories, list);
}
export async function addCategory(name: string, hasVariants: boolean): Promise<Category> {
  const list = await getCategories();
  const cat: Category = { id: newId(), name: name.trim(), hasVariants, createdAt: Date.now() };
  list.push(cat);
  await saveCategories(list);
  return cat;
}
export async function updateCategory(id: ID, name: string, hasVariants: boolean) {
  const list = await getCategories();
  const idx = list.findIndex((c) => c.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], name: name.trim(), hasVariants };
    await saveCategories(list);
  }
}
export async function deleteCategory(id: ID) {
  const list = (await getCategories()).filter((c) => c.id !== id);
  await saveCategories(list);
}

// --- Products ---
export async function getProducts(): Promise<Product[]> {
  return readList<Product>(K.products);
}
export async function saveProducts(list: Product[]) {
  await writeList(K.products, list);
}
export async function addProduct(p: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  const list = await getProducts();
  const now = Date.now();
  const prod: Product = { ...p, id: newId(), createdAt: now, updatedAt: now };
  list.push(prod);
  await saveProducts(list);
  return prod;
}
export async function updateProduct(id: ID, patch: Partial<Product>) {
  const list = await getProducts();
  const idx = list.findIndex((p) => p.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch, updatedAt: Date.now() };
    await saveProducts(list);
    return list[idx];
  }
  return null;
}
export async function deleteProduct(id: ID) {
  const list = (await getProducts()).filter((p) => p.id !== id);
  await saveProducts(list);
}

// --- Stock history ---
export async function getHistory(): Promise<StockHistoryEntry[]> {
  return readList<StockHistoryEntry>(K.history);
}
export async function addHistory(entry: Omit<StockHistoryEntry, "id" | "timestamp">): Promise<StockHistoryEntry> {
  const list = await getHistory();
  const h: StockHistoryEntry = { ...entry, id: newId(), timestamp: Date.now() };
  list.unshift(h);
  await writeList(K.history, list);
  return h;
}

// --- Activity log ---
export async function getActivity(): Promise<ActivityLogEntry[]> {
  return readList<ActivityLogEntry>(K.activity);
}
export async function logActivity(action: string, details: string) {
  const list = await getActivity();
  list.unshift({ id: newId(), action, details, timestamp: Date.now() });
  // keep last 500
  await writeList(K.activity, list.slice(0, 500));
}

// --- Settings ---
export async function getSettings(): Promise<Settings> {
  const raw = (await storage.getItem(K.settings, "")) as string;
  if (!raw) {
    return { theme: "system", defaultMinStock: 20, ownerName: "Daivala Nagaraju" };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { theme: "system", defaultMinStock: 20, ownerName: "Daivala Nagaraju" };
  }
}
export async function saveSettings(s: Settings) {
  await storage.setItem(K.settings, JSON.stringify(s));
}

// --- PIN ---
export async function isPinSet(): Promise<boolean> {
  const v = await storage.getItem(K.pinSet, false);
  return v === true;
}
export async function setPin(pin: string) {
  await storage.secureSet(PIN_KEY, pin);
  await storage.setItem(K.pinSet, true);
}
export async function verifyPin(pin: string): Promise<boolean> {
  const stored = (await storage.secureGet(PIN_KEY, "")) as string;
  return stored === pin;
}
export async function clearPin() {
  await storage.secureRemove(PIN_KEY);
  await storage.setItem(K.pinSet, false);
}

// --- Seeding ---
export async function ensureSeeded() {
  const done = await storage.getItem(K.seeded, false);
  if (done === true) return;

  const companies: Company[] = [
    "EMBOZA",
    "Kajaria",
    "Somany",
    "Johnson",
    "Nitco",
    "SHREEDHA",
    "HOLLIS",
  ].map((name) => ({ id: newId(), name, createdAt: Date.now() }));
  await saveCompanies(companies);

  const cats: { name: string; hasVariants: boolean }[] = [
    // Tile Categories
    { name: "Kitchen Tiles", hasVariants: true },
    { name: "Bathroom Tiles", hasVariants: true },
    { name: "Parking Tiles", hasVariants: false },
    { name: "Elevation Tiles", hasVariants: false },
    { name: "Matt Tiles", hasVariants: false },
    { name: "Double Charged Tiles", hasVariants: false },
    { name: "Floor Tiles", hasVariants: false },
    { name: "Wall Tiles", hasVariants: false },
    { name: "Digital Tiles", hasVariants: false },
    // Sanitary Categories
    { name: "Steel Sink", hasVariants: false },
    { name: "Handmade Sink", hasVariants: false },
    { name: "Ceramic Sink", hasVariants: false },
    { name: "Commodes", hasVariants: false },
    { name: "EWC Sets", hasVariants: false },
    { name: "Tile Cleaner", hasVariants: false },
    { name: "Tile Powder", hasVariants: false },
    { name: "Bleaching Powder", hasVariants: false },
    { name: "HI Power Bleaching", hasVariants: false },
    { name: "Accessories", hasVariants: false },
  ];
  const categories: Category[] = cats.map((c) => ({
    id: newId(),
    name: c.name,
    hasVariants: c.hasVariants,
    createdAt: Date.now(),
  }));
  await saveCategories(categories);

  await storage.setItem(K.seeded, true);
}

// --- Helper computations ---
export function productTotal(p: Product): number {
  if (p.variants) {
    return VARIANT_KEYS.reduce((s, k) => s + (p.variants![k] || 0), 0);
  }
  return p.total || 0;
}

export function isLowStock(p: Product): boolean {
  const t = productTotal(p);
  return t > 0 && t < (p.minStock || 20);
}

export function isOutOfStock(p: Product): boolean {
  return productTotal(p) <= 0;
}

// Full backup snapshot
export async function exportBackup() {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    companies: await getCompanies(),
    categories: await getCategories(),
    products: await getProducts(),
    history: await getHistory(),
    activity: await getActivity(),
    settings: await getSettings(),
  };
}

export async function restoreBackup(data: any) {
  if (!data || typeof data !== "object") throw new Error("Invalid backup file");
  if (Array.isArray(data.companies)) await saveCompanies(data.companies);
  if (Array.isArray(data.categories)) await saveCategories(data.categories);
  if (Array.isArray(data.products)) await saveProducts(data.products);
  if (Array.isArray(data.history)) await writeList(K.history, data.history);
  if (Array.isArray(data.activity)) await writeList(K.activity, data.activity);
  if (data.settings) await saveSettings(data.settings);
  await storage.setItem(K.seeded, true);
}

export async function clearAll() {
  await Promise.all([
    saveCompanies([]),
    saveCategories([]),
    saveProducts([]),
    writeList(K.history, []),
    writeList(K.activity, []),
    storage.setItem(K.seeded, false),
  ]);
}

export function applyStockChange(
  product: Product,
  variant: VariantKey | undefined,
  op: "add" | "reduce",
  qty: number
): { updated: Product; prev: number; curr: number } {
  const updated: Product = { ...product };
  if (product.variants && variant) {
    updated.variants = { ...product.variants };
    const prev = updated.variants[variant] || 0;
    const curr = op === "add" ? prev + qty : prev - qty;
    updated.variants[variant] = curr;
    return { updated, prev, curr };
  }
  const prev = product.total || 0;
  const curr = op === "add" ? prev + qty : prev - qty;
  updated.total = curr;
  return { updated, prev, curr };
}
