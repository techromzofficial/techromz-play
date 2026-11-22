import { Check, Clock3 } from 'lucide-react';
import type { AppBuilderMode, StageId, StageResults } from '../types';
import { STAGES } from '../stages';
import styles from '../AppBuilderGame.module.css';

type Props = {
  mode: AppBuilderMode;
  currentStage: StageId;
  results: StageResults;
  score: number;
  secondsLeft: number;
  celebratingStage: StageId | null;
  scoreDelta: number;
};

export default function StageProgress({ mode, currentStage, results, score, secondsLeft, celebratingStage, scoreDelta }: Props) {
  return (
    <section className={styles.progressBar} aria-label="Mission status">
      <div className={styles.statusMetric}>
        <span>Mission</span>
        <strong>Stage {currentStage} of 4</strong>
      </div>
      <ol className={styles.progressSteps} aria-label="Stage progress">
        {STAGES.map((milestone) => { const stage = milestone.id; return (
          <li key={stage} data-label={milestone.eyebrow} className={`${results[stage].completed ? styles.stepComplete : stage === currentStage ? styles.stepActive : ''} ${celebratingStage === stage ? styles.stepCelebrating : ''}`} aria-label={`Stage ${stage}: ${milestone.eyebrow}${results[stage].completed ? ' complete' : stage === currentStage ? ' current' : ''}`}>
            {results[stage].completed ? <Check size={14} aria-hidden="true" /> : stage}
          </li>
        ); })}
      </ol>
      <div className={styles.statusMetric}>
        <span>Score</span>
        <div className={styles.scoreMetric}><strong key={score} className={styles.scoreValue}>{score}/100</strong>{scoreDelta > 0 && <b key={`${score}-${scoreDelta}`} className={styles.scoreGain}>+{scoreDelta}</b>}</div>
      </div>
      <div className={`${styles.timer} ${mode === 'challenge' && secondsLeft <= 15 ? styles.timerUrgent : ''}`} aria-live="polite">
        <Clock3 size={18} aria-hidden="true" />
        <div><span>{mode === 'challenge' ? 'Time left' : 'Mode'}</span><strong>{mode === 'challenge' ? `${secondsLeft}s` : 'Practice'}</strong></div>
      </div>
    </section>
  );
}
