'use client';
import { useEffect, useState } from 'react';
import styles from './KnowledgeLab.module.css';

export default function LabScoreMeter({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplayed(score); return; }
    const started = performance.now();
    let frame = 0;
    function update(now: number) {
      const amount = Math.min(1, (now - started) / 700);
      setDisplayed(Math.round(score * (1 - (1 - amount) ** 3)));
      if (amount < 1) frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [score]);
  return <div className={styles.scoreMeter} aria-label={`Final score: ${score} out of 100`}>
    <svg viewBox="0 0 180 180" aria-hidden="true"><circle cx="90" cy="90" r="76" className={styles.meterTrack} /><circle cx="90" cy="90" r="76" pathLength="100" className={styles.meterFill} strokeDasharray={`${displayed} 100`} transform="rotate(-90 90 90)" /></svg>
    <p><strong>{displayed}</strong><span>/100</span></p>
  </div>;
}
