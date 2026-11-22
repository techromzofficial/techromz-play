import type { CustomerStatus, Delivery } from './game-engine';
import type { ProductId } from './scenarios';

/** A read-only view. This module has no reducer, dispatch, persistence, or timers. */
export type StoreVisualState = {
  inventory: Record<ProductId, number>;
  selected?: ProductId;
  requested?: ProductId;
  customerId?: number;
  statuses?: CustomerStatus[];
  delivery?: Delivery | null;
  now?: number;
  revenue?: number;
  message?: string;
};
export type VisualCallbacks = { select: (id: ProductId) => void; checkout: () => void };
