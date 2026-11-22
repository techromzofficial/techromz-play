import { useEffect, useState, type CSSProperties } from 'react';
import styles from './RetailRushGame.module.css';

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

export default function AnimatedScoreRing({ score, rank }: { score: number; rank: string }) {
  const finalScore = Math.min(100, Math.max(0, Math.round(score)));
  const [displayScore, setDisplayScore] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayScore(finalScore);
      setStarted(true);
      return;
    }
    setDisplayScore(0);
    setStarted(false);
    let animationFrame = 0;
    let startTime: number | null = null;
    const startTimer = window.setTimeout(() => {
      setStarted(true);
      const animate = (time: number) => {
        if (startTime === null) startTime = time;
        const progress = Math.min((time - startTime) / 1200, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayScore(progress === 1 ? finalScore : Math.round(finalScore * eased));
        if (progress < 1) animationFrame = window.requestAnimationFrame(animate);
      };
      animationFrame = window.requestAnimationFrame(animate);
    }, 350);
    return () => {
      window.clearTimeout(startTimer);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [finalScore]);

  const offset = CIRCUMFERENCE * (1 - (started ? finalScore : 0) / 100);
  const ringStyle = { '--ring-circumference': CIRCUMFERENCE, '--ring-offset': offset, '--ring-final-offset': CIRCUMFERENCE * (1 - finalScore / 100) } as CSSProperties;
  const band = finalScore === 100 ? 'perfect' : finalScore >= 90 ? 'gold' : finalScore >= 80 ? 'blue-gold' : finalScore >= 60 ? 'sapphire' : finalScore >= 40 ? 'royal' : 'muted';

  return <div className={styles.scoreRing} data-score={finalScore} data-band={band} data-rank={rank} role="img"
    aria-label={`Final score: ${finalScore} out of 100. Achievement: ${rank}.`} style={ringStyle}>
    <svg className={styles.scoreRingSvg} viewBox="0 0 120 120" aria-hidden="true" focusable="false">
      <defs><linearGradient id="retail-score-blue-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2563eb" /><stop offset="1" stopColor="#f6c65b" /></linearGradient></defs>
      <circle className={styles.scoreRingTrack} cx="60" cy="60" r={RADIUS} />
      <circle className={styles.scoreRingProgress} cx="60" cy="60" r={RADIUS} pathLength={CIRCUMFERENCE} />
    </svg>
    <span className={styles.scoreRingValue} aria-hidden="true">{displayScore}<small>/100</small></span>
    <span className={styles.scoreRingRank} aria-hidden="true">{rank}</span>
  </div>;
}
