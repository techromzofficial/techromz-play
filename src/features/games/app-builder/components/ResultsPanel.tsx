'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Award, BookOpen, Check, Copy, Facebook, MessageCircle, RefreshCcw, Share2, Sparkles, Trophy } from 'lucide-react';
import { getMobileKickstartUrl } from '@/config/site';
import type { AppBuilderMode, StageId, StageResults } from '../types';
import { STAGES } from '../stages';
import { appBuilderShareText, appBuilderSocialUrl } from '../share';
import { getAppBuilderShareUrl } from '@/config/site';
import ScoreSharePanel from '../../shared/ScoreSharePanel';
import styles from '../AppBuilderGame.module.css';

type Props = {
  mode: AppBuilderMode;
  results: StageResults;
  score: number;
  completed: boolean;
  badge: boolean;
  bestComparison: { previous: number; best: number; isNewBest: boolean } | null;
  onReplay: (mode: AppBuilderMode) => void;
  onShare: () => void;
  onCopy: () => void;
  onSocial: (network: 'facebook' | 'whatsapp') => void;
  onCourseClick: () => void;
  shareFeedback: string;
};

const CONFETTI_PIECES = Array.from({ length: 112 }, (_, index) => ({
  x: (index * 37) % 100,
  drift: ((index * 23) % 30) - 15,
  delay: (index % 16) * 0.1,
  duration: 2.8 + (index % 7) * 0.2,
  color: ['#FFFFFF', '#2563EB', '#1246AB', '#EAF1FF'][index % 4],
}));

function CompletionConfetti({ active, strength }: { active: boolean; strength: 'moderate' | 'strong' | 'perfect' }) {
  const [visible, setVisible] = useState(active);
  useEffect(() => {
    if (!active) { setVisible(false); return; }
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 5500);
    return () => window.clearTimeout(timer);
  }, [active]);
  if (!visible) return null;
  const count = strength === 'perfect' ? 112 : strength === 'strong' ? 84 : 58;
  return <div className={styles.fullConfetti} data-strength={strength} aria-hidden="true">{CONFETTI_PIECES.slice(0, count).map((piece, index) => <i key={index} style={{ '--x': `${piece.x}%`, '--drift': `${piece.drift}vw`, '--delay': `${piece.delay}s`, '--duration': `${piece.duration}s`, '--confetti': piece.color } as CSSProperties} />)}</div>;
}

export default function ResultsPanel({ mode, results, score, completed, badge, bestComparison, onReplay, onShare, onCopy, onSocial, onCourseClick, shareFeedback }: Props) {
  const courseUrl = getMobileKickstartUrl();
  const otherMode: AppBuilderMode = mode === 'challenge' ? 'practice' : 'challenge';
  const improvement = bestComparison ? score - bestComparison.previous : 0;
  const celebration = !completed || score < 75 ? 'normal' : score === 100 ? 'perfect' : score >= 90 ? 'strong' : 'moderate';
  return (
    <main className={styles.resultsPage}>
      <CompletionConfetti active={celebration !== 'normal'} strength={celebration === 'normal' ? 'moderate' : celebration} />
      {celebration !== 'normal' && <section className={styles.victoryBanner} data-strength={celebration} aria-label={`${score === 100 ? 'Perfect score' : 'Achievement'} in App Builder Level 1`}>
        <span className={styles.victoryTrophy} aria-hidden="true"><Trophy size={34} /></span>
        <div><small>APP BUILDER · LEVEL 1</small><strong>{score === 100 ? 'PERFECT SCORE — 100/100' : score >= 90 ? 'OUTSTANDING BUILD' : 'ACHIEVEMENT UNLOCKED'}</strong><p>{score === 100 ? 'Every Study Planner stage was completed with a perfect build.' : 'Your completed build earned a special result.'}</p></div>
        <span className={styles.victorySparkles} aria-hidden="true">✦ · ✦</span>
      </section>}
      <section className={`${styles.resultsCard} ${completed ? styles.resultsCelebrating : ''}`} aria-labelledby="result-title">
        <div className={styles.resultCopy}>
          <span className={styles.missionTag}>{completed ? 'MISSION COMPLETE' : 'TIME EXPIRED'}</span>
          <h1 id="result-title">{completed ? 'You built a simulated Study Planner!' : 'Your build time has expired.'}</h1>
          <p>{completed ? 'You designed, connected, programmed, tested, and repaired a working browser simulation.' : 'Your earned points are safe, but unfinished stages remain unscored. Try again in either mode.'}</p>
          {badge && <div className={styles.badge}><Award size={24} /><div><small>IN-GAME ACHIEVEMENT</small><strong>App Builder Rookie</strong></div></div>}
          <div className={styles.takeaway}><BookOpen size={20} /><p><strong>Learning takeaway</strong><br />{completed ? 'A useful app combines interface structure, navigation, event logic, shared state, and repeatable tests.' : 'Building one stage at a time makes bugs easier to spot and repair.'}</p></div>
        </div>
        <div className={styles.scoreRing} style={{ '--score': `${score * 3.6}deg` } as React.CSSProperties}><div><strong>{score}</strong><span>/100</span><small>{mode === 'challenge' ? 'Challenge' : 'Practice'}</small></div></div>
      </section>
      <section className={styles.breakdown} aria-label="Stage score breakdown">
        {STAGES.map((stage) => { const result = results[stage.id as StageId]; return <article key={stage.id}><span>{result.completed ? <Check size={16} /> : stage.id}</span><div><small>STAGE {stage.id}</small><strong>{stage.eyebrow}</strong><em>{result.completed ? stage.concept : 'Not unlocked'}</em></div><b>{result.points}/25</b></article>; })}
      </section>
      {bestComparison && <section className={`${styles.personalBest} ${bestComparison.isNewBest ? styles.newPersonalBest : ''}`} aria-label="Personal best comparison"><span>{bestComparison.isNewBest ? <Sparkles size={22} /> : <Trophy size={22} />}</span><div><small>{bestComparison.isNewBest ? 'NEW PERSONAL BEST' : 'YOUR PERSONAL BEST'}</small><strong>{bestComparison.best}/100 in {mode === 'challenge' ? 'Challenge' : 'Practice'}</strong><p>{bestComparison.isNewBest ? (bestComparison.previous > 0 ? `You improved by ${improvement} points. Keep the momentum going!` : 'Your first score is saved. Replay to see how much you can improve!') : score === bestComparison.best ? 'You matched your best score — one cleaner run could set a new record.' : `${bestComparison.best - score} more points would match your saved best.`}</p></div></section>}
      <section className={styles.nextSteps} aria-labelledby="next-steps-title">
        <div className={styles.nextStepsCopy}>
          <span>WHAT&apos;S NEXT?</span>
          <h2 id="next-steps-title">Keep building your skills.</h2>
          <p>Replay this mission, switch modes, or continue with the official mobile app development course.</p>
        </div>
        <div className={styles.nextStepActions}>
          <button className={styles.replayPrimary} onClick={() => onReplay(mode)}><RefreshCcw size={18} /> Try Again</button>
          <Link href="/"><ArrowLeft size={18} /> Back to All Games</Link>
          <a className={styles.courseAction} href={courseUrl} target="_blank" rel="noopener noreferrer" onClick={onCourseClick}>Explore Mobile App Development Kickstart <ArrowRight size={18} /></a>
        </div>
        <div className={styles.replayModes}>
          <span>Choose replay mode</span>
          <button className={mode === 'challenge' ? styles.currentMode : ''} onClick={() => onReplay('challenge')}>90s Challenge</button>
          <button className={mode === 'practice' ? styles.currentMode : ''} onClick={() => onReplay('practice')}>Untimed Practice</button>
          <small>Currently completed in {mode === 'challenge' ? 'Challenge' : 'Practice'} mode. Switch to {otherMode === 'challenge' ? 'Challenge' : 'Practice'} for a different pace.</small>
        </div>
      </section>

      <ScoreSharePanel game="App Builder" levelLabel="LEVEL 1 · APP BUILDER" score={score} mode={mode === 'challenge' ? '90-second Challenge' : 'Untimed Practice'} achievement={badge ? 'App Builder Rookie' : completed ? 'Mission Complete' : 'Build Incomplete'} artwork="/images/play/app-builder/app-builder-card-3d-v1.png" brandLogo="/images/institute/techromz-institute-logo-white-840.webp" publicUrl={getAppBuilderShareUrl()} challengeMessage={appBuilderShareText(score, mode)} completed={completed} />
    </main>
  );
}
