import type { BagItem } from '../types/store';

export const ORDERS_STORAGE_KEY = 'maison704_orders_v1';
export const REQUESTS_STORAGE_KEY = 'maison704_custom_requests_v1';

export interface RecordedBagOrder {
  orderNumber: string;
  createdAt: string;
  status: 'new' | 'quoted' | 'in_queue' | 'ready' | 'completed' | 'archived';
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  fulfillment: 'pickup' | 'shipping';
  subtotal: number;
  shipping: number;
  total: number;
  items: BagItem[];
  ownerNotes?: string;
}

export interface RecordedCustomRequest {
  referenceId: string;
  createdAt: string;
  status: 'new' | 'quoted' | 'in_queue' | 'ready' | 'completed' | 'archived';
  category: string;
  neededByDate: string;
  notes: string;
  engravingIdea?: string;
  primaryHex?: string;
  accentHex?: string;
  referenceFileName: string;
  customerName: string;
  customerEmail: string;
  instagramHandle: string;
  ownerNotes?: string;
}

function prependToLocalList<T>(key: string, record: T, maxItems = 100): void {
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? (JSON.parse(raw) as T[]) : [];
    const next = [record, ...(Array.isArray(list) ? list : [])].slice(0, maxItems);
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Ignore localStorage quota errors
  }
}

export async function recordBoutiqueOrder(order: RecordedBagOrder): Promise<void> {
  prependToLocalList(ORDERS_STORAGE_KEY, order);
  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
  } catch {
    // Static hosting fallback (GitHub Pages): already persisted locally
  }
}

export async function recordCustomRequest(req: RecordedCustomRequest): Promise<void> {
  prependToLocalList(REQUESTS_STORAGE_KEY, req);
  try {
    await fetch('/api/custom-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
  } catch {
    // Static hosting fallback (GitHub Pages): already persisted locally
  }
}
