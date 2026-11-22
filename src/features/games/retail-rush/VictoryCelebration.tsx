import styles from './RetailRushGame.module.css';

const rankMessages: Record<string, string> = {
  'Store Starter': 'A promising start to your retail journey!',
  'Smart Retailer': 'Smart decisions are building a stronger store!',
  'Retail Manager': 'Great work balancing customers, stock and profit!',
  'Retail Champion': 'An outstanding shift from start to finish!',
  'Retail Master': 'Excellent work managing your store!',
  'Retail Legend': 'A perfect shift. Retail legend status achieved!',
};

export default function VictoryCelebration({ rank, score, completed }: { rank: string; score: number; completed: boolean }) {
  const tier = Math.max(1, ['Store Starter', 'Smart Retailer', 'Retail Manager', 'Retail Champion', 'Retail Master', 'Retail Legend'].indexOf(rank) + 1);
  const celebrated = completed && score >= 75;
  const headline = !completed ? 'SHIFT REPORT' : score === 100 ? 'PERFECT SCORE — 100/100' : score >= 90 ? 'OUTSTANDING SHIFT' : score >= 75 ? 'ACHIEVEMENT UNLOCKED' : 'SHIFT REPORT';
  return <div className={styles.celebration} data-tier={tier} data-celebrated={celebrated} data-perfect={completed && score === 100}>
    {celebrated && <>
    <div className={styles.trophyStage} aria-hidden="true">
      <span className={styles.trophyGlow} />
      <svg className={styles.trophy} viewBox="0 0 120 120" focusable="false">
        <defs>
          <linearGradient id="retail-trophy-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3bf" /><stop offset=".48" stopColor="#f6c65b" /><stop offset="1" stopColor="#c98b21" /></linearGradient>
          <linearGradient id="retail-trophy-blue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8eb3ff" /><stop offset="1" stopColor="#1246ab" /></linearGradient>
        </defs>
        <path className={styles.trophyCup} d="M35 20h50v18c0 20-10 34-25 38-15-4-25-18-25-38V20Z" />
        <path className={styles.trophyHandle} d="M35 29H19v9c0 15 9 25 24 27M85 29h16v9c0 15-9 25-24 27" />
        <path className={styles.trophyStem} d="M55 73h10v18H55zM39 91h42l7 11H32l7-11Z" />
        <path className={styles.trophyStar} d="m60 31 4.2 8.5 9.3 1.3-6.7 6.6 1.6 9.3-8.4-4.4-8.4 4.4 1.6-9.3-6.7-6.6 9.3-1.3L60 31Z" />
        <path className={styles.trophyShimmer} d="m60 31 4.2 8.5 9.3 1.3-6.7 6.6 1.6 9.3-8.4-4.4-8.4 4.4 1.6-9.3-6.7-6.6 9.3-1.3L60 31Z" />
      </svg>
      <div className={styles.trophySparkles}>
        {Array.from({ length: 4 }, (_, index) => <i key={index} />)}
      </div>
    </div>
    </>}
    <div className={styles.celebrationCopy}>
      <p className={styles.completionTitle}>{celebrated && <span aria-hidden="true">✦</span>} {headline} {celebrated && <span aria-hidden="true">✦</span>}</p>
      <h1 tabIndex={-1} className={styles.resultHeading}>{rank}</h1>
      <p className={styles.rankMessage}>{rankMessages[rank] ?? 'Excellent work managing your store!'}</p>
    </div>
  </div>;
}
