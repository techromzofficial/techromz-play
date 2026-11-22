import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { customersServed, netProfit, scoreForState, type GameState } from './game-engine';
import { achievementForScore } from './scoring';
import { challengeText, RETAIL_RUSH_CHALLENGE_URL, savePersonalBest } from './share';
import { getInstituteBaseUrl } from '@/config/site';
import styles from './RetailRushGame.module.css';
import personalized from './PersonalizedResults.module.css';
import AnimatedScoreRing from './AnimatedScoreRing';
import VictoryCelebration from './VictoryCelebration';
import VictoryConfetti from './VictoryConfetti';
import ScoreSharePanel from '../shared/ScoreSharePanel';

const money = (value: number) => `LKR ${value.toLocaleString('en-LK')}`;

export function learningAdvice(state: GameState): string[] {
  const advice: string[] = [];
  if (state.readyOrders < 6) advice.push('Plan reorders before customers arrive. Inventory alerts help you keep the right products ready.');
  if (customersServed(state) < 6) advice.push('Review missed orders and customer budgets. Reorder alerts and affordable prices help you complete more sales.');
  if (state.deliveryExpenses > 0) advice.push('Order ahead with standard delivery. Procurement planning avoids express fees and protects profit.');
  if (netProfit(state) < 750) advice.push('Compare selling prices with product costs: revenue is not profit. Use offers where needed to meet a customer’s budget.');
  if (customersServed(state) === 6) advice.push('You connected POS sales, inventory and reporting. Retail software keeps these records in sync after every transaction.');
  return advice;
}

export default function RushResults({ state, playerName, onReplay }: { state: GameState; playerName?: string; onReplay: () => void }) {
  const score = scoreForState(state);
  const rank = achievementForScore(score.total);
  const tier = ['Store Starter', 'Smart Retailer', 'Retail Manager', 'Retail Champion', 'Retail Master', 'Retail Legend'].indexOf(rank) + 1;
  const [best, setBest] = useState<number | null>(null);
  const url = RETAIL_RUSH_CHALLENGE_URL;
  useEffect(() => {
    setBest(savePersonalBest(state.mode, score.total));
  }, [state.mode, score.total]);
  const text = challengeText(score.total, state.mode, rank);
  const allCustomersServed = customersServed(state) === 6;
  const stats = [['Revenue', money(state.revenue)], ['Profit', money(netProfit(state))], ['Cash', money(state.cash)], ['Customers', `${customersServed(state)}/6`], ['Stock ready', `${state.readyOrders}/6`], ['Delivery fees', money(state.deliveryExpenses)]];
  const breakdown = [['Profitability', score.profitability, 40], ['Customer service', score.customerService, 30], ['Stock readiness', score.stockReadiness, 10], ['Stock efficiency', score.stockEfficiency, 10], ['Pricing', score.pricing, 10]] as const;
  return <section className={styles.results} aria-label="Shift results">
    <VictoryConfetti rank={rank} score={score.total} completed={allCustomersServed} />
    <div className={`${styles.scoreCard} ${playerName ? personalized.card : ''}`} data-rank={rank}>
      {playerName && <>
        <p className={personalized.greeting} role="status">Well played, {playerName}!<span className={personalized.srOnly}> Your final score is {score.total} out of 100. {rank}.</span></p>
        {allCustomersServed && score.total >= 75 && <div className={personalized.particles} aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--particle': index } as CSSProperties} />)}</div>}
      </>}
      <p className={styles.resultStatus}>{allCustomersServed ? 'MISSION COMPLETED' : state.mode === 'timed' ? 'SHIFT EXPIRED' : 'SHIFT ENDED'}</p>
      <VictoryCelebration rank={rank} score={score.total} completed={allCustomersServed} />
      <p className={styles.eyebrow}>{state.mode === 'timed' ? 'TIMED CHALLENGE' : 'UNTIMED PRACTICE'} · SHIFT REPORT</p>
      <div className={styles.rankSteps} aria-label={`Achievement tier ${tier} of 6`}>{Array.from({ length: 6 }, (_, index) => <span key={index} data-earned={index < tier} />)}</div>
      <AnimatedScoreRing score={score.total} rank={rank} />
      <p className={styles.best}>{best === null ? 'Personal best unavailable on this device.' : `Personal best · ${state.mode}: ${best}/100`}</p>
      <div className={styles.badges} aria-label="Skills demonstrated">
        {customersServed(state) === 6 && <span>Customer care</span>}{state.readyOrders === 6 && <span>Stock planner</span>}{score.pricing === 10 && <span>Smart pricing</span>}{allCustomersServed && score.total === 100 && <span>Perfect shift</span>}
      </div>
      <div className={styles.resultStats}>{stats.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <div className={styles.breakdown}>{breakdown.map(([label, value, max]) => <div key={label}><span>{label}</span><strong>{Number(value.toFixed(1))}/{max}</strong><meter min={0} max={max} value={value} aria-label={label} /></div>)}</div>
      <ScoreSharePanel game="Retail Rush" levelLabel="MISSION 002 · RETAIL RUSH" score={score.total} mode={state.mode === 'timed' ? '60-second Challenge' : 'Untimed Practice'} achievement={rank} artwork="/images/institute/play/retail-rush-diorama.png" brandLogo="/images/institute/techromz-institute-logo-white-840.webp" publicUrl={url} challengeMessage={text} completed={allCustomersServed} />
      <p className={styles.disclaimer}>Fictional learning simulation. Scores are not a formal skills assessment.{state.mode === 'practice' ? ' Practice results are separate from timed challenges.' : ''}</p>
    </div>
    <div className={styles.resultSide}>
      <section className={styles.panel}><p className={styles.eyebrow}>YOUR NEXT SMART MOVE</p><h2>From store to software</h2><ul className={styles.advice}>{learningAdvice(state).map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section className={`${styles.panel} ${styles.coursePanel}`}><p className={styles.eyebrow}>BUILD WHAT YOU JUST PLAYED</p><h2>You managed the store. Now learn to build the software.</h2><p className={styles.muted}>Explore Retail Kickstart and the current course details.</p><a className={styles.primaryButton} href={`${getInstituteBaseUrl()}/institute/courses/retail-kickstart`} target="_blank" rel="noopener noreferrer">Explore Course <ArrowRight size={18} /></a></section>
      <div className={styles.resultActions}><button className={styles.secondaryButton} onClick={onReplay}><RotateCcw size={18} /> Play Again</button><Link className={styles.primaryButton} href="/">Back to All Games</Link></div>
    </div>
  </section>;
}
