export const PRODUCT_IDS = ['water', 'milk', 'snacks'] as const;

export type ProductId = (typeof PRODUCT_IDS)[number];

export type Product = {
  id: ProductId;
  name: string;
  cost: number;
  standardPrice: number;
  offerPrice: number;
  openingStock: number;
};

export type Customer = {
  id: number;
  arrivalSeconds: number;
  productId: ProductId;
  quantity: number;
  budget: number;
};

export const PRODUCTS: Record<ProductId, Product> = {
  water: { id: 'water', name: 'Water', cost: 60, standardPrice: 100, offerPrice: 90, openingStock: 3 },
  milk: { id: 'milk', name: 'Milk', cost: 200, standardPrice: 300, offerPrice: 270, openingStock: 2 },
  snacks: { id: 'snacks', name: 'Snacks', cost: 100, standardPrice: 160, offerPrice: 140, openingStock: 3 },
};

export const CUSTOMERS: Customer[] = [
  { id: 1, arrivalSeconds: 0, productId: 'water', quantity: 2, budget: 200 },
  { id: 2, arrivalSeconds: 10, productId: 'milk', quantity: 2, budget: 540 },
  { id: 3, arrivalSeconds: 20, productId: 'snacks', quantity: 2, budget: 320 },
  { id: 4, arrivalSeconds: 30, productId: 'water', quantity: 3, budget: 270 },
  { id: 5, arrivalSeconds: 40, productId: 'milk', quantity: 2, budget: 600 },
  { id: 6, arrivalSeconds: 50, productId: 'snacks', quantity: 2, budget: 320 },
];

export const STARTING_CASH = 2_000;
export const GAME_DURATION_MS = 60_000;
export const CUSTOMER_PATIENCE_MS = 10_000;
export const RESTOCK_UNITS = 2;
export const STANDARD_DELIVERY_MS = 4_000;
export const EXPRESS_DELIVERY_MS = 1_000;
export const EXPRESS_DELIVERY_FEE = 30;

export const openingInventory = () => Object.fromEntries(
  PRODUCT_IDS.map((id) => [id, PRODUCTS[id].openingStock]),
) as Record<ProductId, number>;

