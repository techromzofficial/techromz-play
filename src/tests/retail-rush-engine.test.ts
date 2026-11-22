import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  gameReducer,
  netProfit,
  customersServed,
} from '../features/games/retail-rush/game-engine';

describe('Retail Rush Game Engine Mechanics', () => {
  it('initializes with starting cash of LKR 2,000 and 0 revenue', () => {
    const state = createInitialState();
    expect(state.cash).toBe(2000);
    expect(state.revenue).toBe(0);
    expect(state.deliveryExpenses).toBe(0);
    expect(state.phase).toBe('intro');
    expect(customersServed(state)).toBe(0);
  });

  it('handles standard and express restock transactions', () => {
    const now = Date.now();
    let state = gameReducer(createInitialState(), { type: 'start', mode: 'timed', now });
    expect(state.phase).toBe('playing');

    // Restock water standard: cost is 60 * 2 = 120
    state = gameReducer(state, { type: 'restock', productId: 'water', speed: 'standard', now });
    expect(state.cash).toBe(2000 - 120);
    expect(state.delivery?.productId).toBe('water');
    expect(state.delivery?.speed).toBe('standard');
    expect(state.delivery?.completesAt).toBe(now + 4000);

    // Fast-forward delivery arrival
    state = gameReducer(state, { type: 'tick', now: now + 4001 });
    expect(state.delivery).toBeNull();
    expect(state.inventory.water).toBe(5); // 3 initial + 2
  });

  it('handles express delivery fee correctly', () => {
    const now = Date.now();
    let state = gameReducer(createInitialState(), { type: 'start', mode: 'timed', now });

    // Express restock: cost (120) + express fee (30) = 150
    state = gameReducer(state, { type: 'restock', productId: 'water', speed: 'express', now });
    expect(state.cash).toBe(2000 - 150);
    expect(state.deliveryExpenses).toBe(30);
    expect(state.delivery?.completesAt).toBe(now + 1000);
  });

  it('handles checkout transactions with budget checks', () => {
    const now = Date.now();
    let state = gameReducer(createInitialState(), { type: 'start', mode: 'timed', now });

    // First customer wants 2 water at budget 200. Standard price is 100 * 2 = 200.
    state = gameReducer(state, { type: 'checkout', price: 'standard', now });
    expect(state.revenue).toBe(200);
    expect(state.cash).toBe(2000 + 200);
    expect(state.customerStatuses[0]).toBe('served');
    expect(customersServed(state)).toBe(1);
    expect(netProfit(state)).toBe(80); // 200 revenue - 120 COGS (2 water * 60)
  });
});
