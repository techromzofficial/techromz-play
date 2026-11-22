import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  achievementForScore,
} from '../features/games/retail-rush/scoring';
import {
  nameLength,
  playerNameError,
} from '../features/games/retail-rush/PlayerNameSession';
import {
  validateChallenge,
  challengeUrl,
} from '../features/games/retail-rush/share';

describe('Retail Rush Scoring & Session Validation', () => {
  it('calculates perfect score of 100 for flawless shift', () => {
    const score = calculateScore({
      netProfit: 1400,
      customersServed: 6,
      readyOrders: 6,
      budgetSensitiveCustomersServed: 2,
      inventory: { water: 1, milk: 0, snacks: 1 },
    });
    expect(score.profitability).toBe(40);
    expect(score.customerService).toBe(30);
    expect(score.stockReadiness).toBe(10);
    expect(score.stockEfficiency).toBe(10);
    expect(score.pricing).toBe(10);
    expect(score.total).toBe(100);
  });

  it('maps scores to correct achievement rank tiers', () => {
    expect(achievementForScore(100)).toBe('Retail Legend');
    expect(achievementForScore(90)).toBe('Retail Master');
    expect(achievementForScore(80)).toBe('Retail Champion');
    expect(achievementForScore(65)).toBe('Retail Manager');
    expect(achievementForScore(45)).toBe('Smart Retailer');
    expect(achievementForScore(30)).toBe('Store Starter');
  });

  it('validates player names correctly including grapheme clusters', () => {
    expect(playerNameError('')).toBe('Please enter your name.');
    expect(playerNameError('   ')).toBe('Please enter your name.');
    expect(playerNameError('Kasun')).toBe('');
    expect(nameLength('Kasun')).toBe(5);

    // Sinhala combining characters: නි (1) + ම (1) + ල් (1) = 3 graphemes
    expect(nameLength('නිමල්')).toBe(3);
    expect(playerNameError('A'.repeat(31))).toContain('30 characters');
  });

  it('validates challenge scenario parameters and builds challenge URL', () => {
    expect(validateChallenge('')).toBe('default');
    expect(validateChallenge('?scenario=retail-001&v=1')).toBe('valid');
    expect(validateChallenge('?scenario=invalid&v=1')).toBe('invalid');

    const url = challengeUrl('https://play.mycustomdomain.com');
    expect(url).toContain('https://play.mycustomdomain.com/retail-rush?scenario=retail-001&v=1');
  });
});
