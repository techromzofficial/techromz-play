import type { ProductId } from './scenarios';

export type ScoreInput = {
  netProfit: number;
  customersServed: number;
  readyOrders: number;
  budgetSensitiveCustomersServed: number;
  inventory: Record<ProductId, number>;
};

export type ScoreBreakdown = {
  profitability: number;
  customerService: number;
  stockReadiness: number;
  stockEfficiency: number;
  pricing: number;
  total: number;
};

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const profitability = 40 * clamp(input.netProfit / 750, 0, 1);
  const customerService = Math.min(30, input.customersServed * 5);
  const stockReadiness = 10 * clamp(input.readyOrders / 6, 0, 1);
  const unsoldUnits = Object.values(input.inventory).reduce((sum, quantity) => sum + quantity, 0);
  const stockEfficiency = input.customersServed === 6 && unsoldUnits <= 2 ? 10 : 0;
  const pricing = Math.min(10, input.budgetSensitiveCustomersServed * 5);
  const total = clamp(Math.round(profitability + customerService + stockReadiness + stockEfficiency + pricing), 0, 100);

  return { profitability, customerService, stockReadiness, stockEfficiency, pricing, total };
}

export function achievementForScore(score: number) {
  if (score === 100) return 'Retail Legend';
  if (score >= 90) return 'Retail Master';
  if (score >= 80) return 'Retail Champion';
  if (score >= 60) return 'Retail Manager';
  if (score >= 40) return 'Smart Retailer';
  return 'Store Starter';
}

