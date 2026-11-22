import { useEffect, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import styles from './RetailRushGame.module.css';

const RANKS = ['Store Starter', 'Smart Retailer', 'Retail Manager', 'Retail Champion', 'Retail Master', 'Retail Legend'];
const PARTICLE_COUNTS = [70, 100, 125, 150, 180, 220];
const COLOURS = ['#ff3158', '#2563eb', '#facc15', '#f6c65b', '#ffffff', '#22e6bd', '#a855f7', '#ff8a34', '#74ef38', '#ff3eb5'];
const LEGEND_COLOURS = ['#f6c65b', '#ff3158', '#f6c65b', '#2563eb', '#facc15', '#ffffff', '#22e6bd', '#f6c65b', '#a855f7', '#ff8a34', '#74ef38', '#ff3eb5'];
const CONFETTI_LIFETIME_MS = 9500;

function particleStyle(index: number, legend: boolean): CSSProperties {
  const colours = legend ? LEGEND_COLOURS : COLOURS;
  return {
    '--confetti-x': `${(index * 37 + 11) % 100}%`,
    '--confetti-width': `${5 + (index * 7) % 7}px`,
    '--confetti-height': `${8 + (index * 11) % 10}px`,
    '--confetti-colour': colours[index % colours.length],
    '--confetti-delay': `${(index * 47) % 2100}ms`,
    '--confetti-duration': `${5100 + (index * 83) % 1800}ms`,
    '--confetti-drift-a': `${-48 + (index * 29) % 97}px`,
    '--confetti-drift-b': `${-82 + (index * 53) % 165}px`,
    '--confetti-drift-final': `${-62 + (index * 41) % 125}px`,
    '--confetti-turn-a': `${-210 + (index * 71) % 620}deg`,
    '--confetti-turn-b': `${520 + (index * 113) % 980}deg`,
    '--confetti-turn-final': `${760 + (index * 137) % 1100}deg`,
    '--confetti-flutter': `${320 + (index * 43) % 420}ms`,
    '--confetti-flutter-delay': `${-((index * 67) % 500)}ms`,
  } as CSSProperties;
}

export default function VictoryConfetti({ rank, score, completed }: { rank: string; score: number; completed: boolean }) {
  const [visible, setVisible] = useState(false);
  const [densityLimit, setDensityLimit] = useState(PARTICLE_COUNTS[PARTICLE_COUNTS.length - 1]);
  const tier = Math.max(1, RANKS.indexOf(rank) + 1);
  const particleCount = Math.min(PARTICLE_COUNTS[tier - 1], densityLimit);

  useEffect(() => {
    if (!completed || score < 75) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    setDensityLimit(window.innerWidth <= 400 ? 80 : window.innerWidth <= 760 ? 110 : window.innerWidth <= 1024 ? 160 : PARTICLE_COUNTS[PARTICLE_COUNTS.length - 1]);
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), CONFETTI_LIFETIME_MS);
    return () => window.clearTimeout(timer);
  }, [completed, score]);

  if (!visible || typeof document === 'undefined') return null;

  return createPortal(<div className={styles.confettiOverlay} data-testid="victory-confetti" data-tier={tier} aria-hidden="true">
    {Array.from({ length: particleCount }, (_, index) => <i
      className={styles.confettiFall}
      data-shape={index % 4}
      key={index}
      style={particleStyle(index, tier === 6)}
    ><span /></i>)}
  </div>, document.body);
}
