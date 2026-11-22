import {
  CUSTOMER_PATIENCE_MS,
  CUSTOMERS,
  EXPRESS_DELIVERY_FEE,
  EXPRESS_DELIVERY_MS,
  GAME_DURATION_MS,
  openingInventory,
  PRODUCT_IDS,
  PRODUCTS,
  RESTOCK_UNITS,
  STANDARD_DELIVERY_MS,
  STARTING_CASH,
  type ProductId,
} from './scenarios';
import { calculateScore, type ScoreBreakdown } from './scoring';

export type GameMode = 'timed' | 'practice';
export type GamePhase = 'intro' | 'playing' | 'results';
export type CustomerStatus = 'pending' | 'active' | 'served' | 'expired';
export type PriceType = 'standard' | 'offer';
export type DeliverySpeed = 'standard' | 'express';

export type Delivery = {
  productId: ProductId;
  units: number;
  orderedAt: number;
  completesAt: number;
  purchaseCost: number;
  fee: number;
  speed: DeliverySpeed;
};

export type GameState = {
  phase: GamePhase;
  mode: GameMode;
  startedAt: number | null;
  now: number;
  cash: number;
  revenue: number;
  costOfGoodsSold: number;
  deliveryExpenses: number;
  inventory: Record<ProductId, number>;
  customerStatuses: CustomerStatus[];
  readinessRecorded: boolean[];
  readyOrders: number;
  budgetSensitiveCustomersServed: number;
  delivery: Delivery | null;
  message: string;
};

export type GameAction =
  | { type: 'start'; mode: GameMode; now: number }
  | { type: 'tick'; now: number }
  | { type: 'checkout'; price: PriceType; now: number }
  | { type: 'restock'; productId: ProductId; speed: DeliverySpeed; now: number }
  | { type: 'restart' };

export const createInitialState = (): GameState => ({
  phase: 'intro',
  mode: 'timed',
  startedAt: null,
  now: 0,
  cash: STARTING_CASH,
  revenue: 0,
  costOfGoodsSold: 0,
  deliveryExpenses: 0,
  inventory: openingInventory(),
  customerStatuses: CUSTOMERS.map(() => 'pending'),
  readinessRecorded: CUSTOMERS.map(() => false),
  readyOrders: 0,
  budgetSensitiveCustomersServed: 0,
  delivery: null,
  message: '',
});

export const netProfit = (state: GameState) => state.revenue - state.costOfGoodsSold - state.deliveryExpenses;
export const customersServed = (state: GameState) => state.customerStatuses.filter((status) => status === 'served').length;
export const activeCustomerIndex = (state: GameState) => state.customerStatuses.findIndex((status) => status === 'active');
export const scoreForState = (state: GameState): ScoreBreakdown => calculateScore({
  netProfit: netProfit(state),
  customersServed: customersServed(state),
  readyOrders: state.readyOrders,
  budgetSensitiveCustomersServed: state.budgetSensitiveCustomersServed,
  inventory: state.inventory,
});

function activateCustomer(state: GameState, index: number) {
  if (state.customerStatuses[index] !== 'pending') return state;
  const customer = CUSTOMERS[index];
  const ready = state.inventory[customer.productId] >= customer.quantity;
  const statuses = [...state.customerStatuses];
  const recorded = [...state.readinessRecorded];
  statuses[index] = 'active';
  recorded[index] = true;
  return {
    ...state,
    customerStatuses: statuses,
    readinessRecorded: recorded,
    readyOrders: state.readyOrders + (ready ? 1 : 0),
  };
}

function completeDelivery(state: GameState) {
  if (!state.delivery) return state;
  const delivery = state.delivery;
  return {
    ...state,
    inventory: { ...state.inventory, [delivery.productId]: state.inventory[delivery.productId] + delivery.units },
    delivery: null,
    message: `${PRODUCTS[delivery.productId].name} delivery arrived.`,
  };
}

function finishIfComplete(state: GameState) {
  const allFinished = state.customerStatuses.every((status) => status === 'served' || status === 'expired');
  return allFinished ? { ...state, phase: 'results' as const, delivery: null } : state;
}

export function advanceGame(input: GameState, targetNow: number): GameState {
  if (input.phase !== 'playing' || input.startedAt === null || targetNow <= input.now) return input;
  const startedAt = input.startedAt;
  let state = input;

  if (state.mode === 'practice') {
    if (state.delivery && state.delivery.completesAt <= targetNow) state = completeDelivery(state);
    return { ...state, now: targetNow };
  }

  const gameEnd = startedAt + GAME_DURATION_MS;
  const cappedNow = Math.min(targetNow, gameEnd);
  const events: { time: number; priority: number; kind: 'delivery' | 'expiry' | 'arrival'; index?: number }[] = [];

  if (state.delivery && state.delivery.completesAt > state.now && state.delivery.completesAt <= cappedNow) {
    events.push({ time: state.delivery.completesAt, priority: 0, kind: 'delivery' });
  }
  CUSTOMERS.forEach((customer, index) => {
    const arrival = startedAt + customer.arrivalSeconds * 1000;
    const expiry = arrival + CUSTOMER_PATIENCE_MS;
    if (arrival > state.now && arrival <= cappedNow) events.push({ time: arrival, priority: 2, kind: 'arrival', index });
    if (expiry > state.now && expiry <= cappedNow) events.push({ time: expiry, priority: 1, kind: 'expiry', index });
  });
  events.sort((a, b) => a.time - b.time || a.priority - b.priority);

  for (const event of events) {
    state = { ...state, now: event.time };
    if (event.kind === 'delivery' && state.delivery && state.delivery.completesAt === event.time) {
      state = completeDelivery(state);
    } else if (event.kind === 'expiry' && event.index !== undefined && state.customerStatuses[event.index] === 'active') {
      const statuses = [...state.customerStatuses];
      statuses[event.index] = 'expired';
      state = { ...state, customerStatuses: statuses, message: `Customer ${event.index + 1} left before checkout.` };
    } else if (event.kind === 'arrival' && event.index !== undefined) {
      state = activateCustomer(state, event.index);
    }
  }

  state = { ...state, now: cappedNow };
  if (cappedNow >= gameEnd) {
    const statuses = state.customerStatuses.map((status) => status === 'active' || status === 'pending' ? 'expired' : status) as CustomerStatus[];
    return { ...state, phase: 'results', customerStatuses: statuses, delivery: null, message: 'The 60-second store shift is complete.' };
  }
  return finishIfComplete(state);
}

function startGame(mode: GameMode, now: number) {
  let state: GameState = { ...createInitialState(), phase: 'playing', mode, startedAt: now, now };
  state = activateCustomer(state, 0);
  return state;
}

function checkout(input: GameState, priceType: PriceType, now: number): GameState {
  let state = advanceGame(input, now);
  if (state.phase !== 'playing') return state;
  const index = activeCustomerIndex(state);
  if (index < 0) return { ...state, message: 'The next customer has not arrived yet.' };
  const customer = CUSTOMERS[index];
  const product = PRODUCTS[customer.productId];
  const unitPrice = priceType === 'standard' ? product.standardPrice : product.offerPrice;
  const total = unitPrice * customer.quantity;
  if (total > customer.budget) return { ...state, message: `Customer ${customer.id} cannot afford that price.` };
  if (state.inventory[customer.productId] < customer.quantity) return { ...state, message: `Not enough ${product.name} stock for the complete order.` };

  const statuses = [...state.customerStatuses];
  statuses[index] = 'served';
  state = {
    ...state,
    cash: state.cash + total,
    revenue: state.revenue + total,
    costOfGoodsSold: state.costOfGoodsSold + product.cost * customer.quantity,
    inventory: { ...state.inventory, [customer.productId]: state.inventory[customer.productId] - customer.quantity },
    customerStatuses: statuses,
    budgetSensitiveCustomersServed: state.budgetSensitiveCustomersServed + (product.standardPrice * customer.quantity > customer.budget ? 1 : 0),
    message: `Customer ${customer.id} served for LKR ${total.toLocaleString('en-LK')}.`,
  };

  if (state.mode === 'practice') {
    const next = state.customerStatuses.findIndex((status) => status === 'pending');
    if (next >= 0) state = activateCustomer(state, next);
  }
  return finishIfComplete(state);
}

function restock(input: GameState, productId: ProductId, speed: DeliverySpeed, now: number): GameState {
  let state = advanceGame(input, now);
  if (state.phase !== 'playing') return state;
  if (state.delivery) return { ...state, message: 'Only one delivery can be active at a time.' };
  const product = PRODUCTS[productId];
  const purchaseCost = product.cost * RESTOCK_UNITS;
  const fee = speed === 'express' ? EXPRESS_DELIVERY_FEE : 0;
  const totalCost = purchaseCost + fee;
  if (state.cash < totalCost) return { ...state, message: `Insufficient cash for this ${product.name} delivery.` };
  const duration = speed === 'express' ? EXPRESS_DELIVERY_MS : STANDARD_DELIVERY_MS;
  return {
    ...state,
    cash: state.cash - totalCost,
    deliveryExpenses: state.deliveryExpenses + fee,
    delivery: { productId, units: RESTOCK_UNITS, orderedAt: now, completesAt: now + duration, purchaseCost, fee, speed },
    message: `${speed === 'express' ? 'Express' : 'Standard'} ${product.name} delivery ordered.`,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start': return startGame(action.mode, action.now);
    case 'tick': return advanceGame(state, action.now);
    case 'checkout': return checkout(state, action.price, action.now);
    case 'restock': return restock(state, action.productId, action.speed, action.now);
    case 'restart': return createInitialState();
    default: return state;
  }
}

export function secondsRemaining(state: GameState) {
  if (state.mode === 'practice' || state.startedAt === null) return null;
  return Math.max(0, Math.ceil((state.startedAt + GAME_DURATION_MS - state.now) / 1000));
}

export function customerSecondsRemaining(state: GameState) {
  const index = activeCustomerIndex(state);
  if (index < 0 || state.mode === 'practice' || state.startedAt === null) return null;
  const expiry = state.startedAt + CUSTOMERS[index].arrivalSeconds * 1000 + CUSTOMER_PATIENCE_MS;
  return Math.max(0, Math.ceil((expiry - state.now) / 1000));
}

export function inventoryUnits(state: GameState) {
  return PRODUCT_IDS.reduce((sum, id) => sum + state.inventory[id], 0);
}
