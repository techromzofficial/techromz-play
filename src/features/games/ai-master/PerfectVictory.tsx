import { Trophy } from 'lucide-react';
import styles from './PerfectVictory.module.css';

export default function PerfectVictory({ label }: { label: string }) {
  return <><section className={styles.victory} aria-label={`Perfect score in ${label}`}><div className={styles.sparkles} aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--x': `${(i * 47) % 100}%`, '--y': `${(i * 67) % 100}%`, '--d': `${(i % 6) * .12}s` } as React.CSSProperties} />)}</div><div className={styles.trophy}><Trophy size={34} /></div><h2>PERFECT SCORE — 100/100<span>{label.toUpperCase()}</span></h2><p>Every mission decision was on target. A perfect result.</p></section><div className={styles.streamers} aria-hidden="true">{Array.from({ length: 46 }, (_, i) => <i key={i} style={{ '--x': `${(i * 37) % 100}%`, '--d': `${(i % 10) * .07}s`, '--c': ['#fff', '#8eb3ff', '#2563eb', '#f6c65b'][i % 4] } as React.CSSProperties} />)}</div></>;
}
