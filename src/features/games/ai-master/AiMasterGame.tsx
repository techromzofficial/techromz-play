'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import Link from 'next/link';
import AiCompanion from './AiCompanion';
import MissionLobby from './MissionLobby';
import KnowledgeLab from './KnowledgeLab';
import { trackAiMasterEvent } from '../../analytics/instituteAnalytics';
import styles from './AiMasterGame.module.css';
import { ArrowRight, Bot, CheckCircle, Clock, Copy, Facebook, LockKeyhole, MessageCircle, RotateCcw, Share2, Sparkles, Star, Trophy } from 'lucide-react';
import {
  createLevel1InitialState,
  level1Instructions,
  level1ImprovementTip,
  level1Reducer,
  level1ResponseFor,
  level1Roles,
  scoreLevel1,
  type Level1Phase,
} from './levels/level1';
import {
  createDefaultAiMasterProgress,
  loadAiMasterProgress,
  recordAiMasterResult,
  canPlayAiMasterLevel,
} from './storage';
import { getAiMasterShareUrl, getInstituteBaseUrl } from '@/config/site';
import ScoreSharePanel from '../shared/ScoreSharePanel';
import PerfectVictory from './PerfectVictory';

export const CHALLENGE_URL = getAiMasterShareUrl(1);

export function achievementFor(score: number, expired = false) {
  if (score === 100) return { title: 'AI Master', detail: 'Perfect build — every mission decision was on target.' };
  if (score >= 70) return { title: 'Prompt Pioneer', detail: 'Strong build — your assistant has a reliable foundation.' };
  if (score >= 40) return { title: 'AI Explorer', detail: 'Good start — refine the role and instructions to score higher.' };
  return { title: expired ? 'Quick Thinker' : 'AI Rookie', detail: expired ? 'You made progress under pressure. Replay and finish the build.' : 'Every expert starts here. Replay and test a sharper setup.' };
}

export function challengeText(score: number, timed: boolean, expired = false) {
  if (score === 100) return `I scored 100/100 in the Techromz AI Master Challenge${timed ? ' in 30 seconds' : ' in practice mode'}! Can you match my 100/100? Play free and challenge your friends.`;
  if (expired) return `I scored ${score}/100 in the Techromz AI Master Challenge. Can you beat my score? Play free and challenge your friends.`;
  return `I scored ${score}/100 in the Techromz AI Master Challenge${timed ? ' in 30 seconds' : ' in practice mode'}! Can you beat my score? Play free and challenge your friends.`;
}

const roles = level1Roles;
const instructions = level1Instructions;
const primary = 'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-base font-bold text-white transition hover:bg-[#1246AB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50';
const secondary = 'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-base font-semibold text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white';

export default function AiMasterGame() {
  const [s, dispatch] = useReducer(level1Reducer, undefined, createLevel1InitialState);
  const [activeLevel, setActiveLevel] = useState<1 | 2>(1);
  const heading = useRef<HTMLHeadingElement>(null);
  const [shareStatus, setShareStatus] = useState('');
  const [shareFallback, setShareFallback] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);
  const [progress, setProgress] = useState(createDefaultAiMasterProgress);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [accessNotice, setAccessNotice] = useState('');
  const [justUnlocked, setJustUnlocked] = useState(false);
  const latestProgress = useRef(progress);
  latestProgress.current = progress;
  useEffect(() => {
    setProgress(loadAiMasterProgress());
    setProgressLoaded(true);
  }, []);
  useEffect(() => {
    if (!progressLoaded) return;
    const syncLevelFromUrl = () => {
      const url = new URL(window.location.href);
      const requested = url.searchParams.get('level');
      const requestedLevel2 = requested === '2';
      dispatch({ type: 'reset' });
      setJustUnlocked(false);
      if (requestedLevel2 && canPlayAiMasterLevel(latestProgress.current, 2)) {
        setAccessNotice('');
        setActiveLevel(2);
        return;
      }
      setActiveLevel(1);
      if (requested && requested !== '1') {
        url.searchParams.delete('level');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
        setAccessNotice(requestedLevel2 ? 'Complete Level 1 with at least 70/100 to unlock Level 2.' : 'Level 3 is locked. Coming Soon.');
      }
    };
    syncLevelFromUrl();
    window.addEventListener('popstate', syncLevelFromUrl);
    return () => window.removeEventListener('popstate', syncLevelFromUrl);
  }, [progressLoaded]);
  useEffect(() => {
    if (s.phase !== 'intro') heading.current?.focus();
  }, [s.phase]);
  useEffect(() => {
    if (s.deadline === null || s.phase === 'result' || s.phase === 'intro') return;
    const timer = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 150);
    return () => window.clearInterval(timer);
  }, [s.deadline, s.phase]);
  const { rolePoints, instructionPoints, verificationPoints, total: score } = scoreLevel1(s);

  useEffect(() => {
    if (s.phase !== 'result') {
      setDisplayedScore(0);
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayedScore(score);
      return;
    }

    const startedAt = performance.now();
    let frame = 0;
    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / 650, 1);
      setDisplayedScore(Math.round(score * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = window.requestAnimationFrame(update);
    };
    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [s.phase, score]);

  const previousPhase = useRef<Level1Phase>('intro');

  useEffect(() => {
    const previous = previousPhase.current;
    previousPhase.current = s.phase;

    if (previous === s.phase) return;

    const game_mode = s.timed ? 'timed' : 'practice';

    if (s.phase === 'role') {
      trackAiMasterEvent({
        name: 'game_started',
        game_mode,
      });
    }

    if (s.phase === 'result') {
      const updatedProgress = recordAiMasterResult(1, game_mode, score, !s.expired && s.verified !== null, undefined, latestProgress.current);
      if (!latestProgress.current.level2Unlocked && updatedProgress.level2Unlocked) {
        setJustUnlocked(true);
        trackAiMasterEvent({ name: 'level_unlock', level: 2, game_mode });
      }
      setProgress(updatedProgress);
      trackAiMasterEvent({
        name: s.expired ? 'game_timeout' : 'game_completed',
        game_mode,
        game_score: score,
      });
    }
  }, [s.phase, s.timed, s.expired, score, progress.level2Unlocked]);

  const step = s.phase === 'role' ? 1 : s.phase === 'instructions' ? 2 : 3;
  const active = s.phase !== 'intro' && s.phase !== 'result';
  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [active]);
  const chosenRole = roles.find(r => r.id === s.role);
  const achievement = achievementFor(score, s.expired);
  const improvementTip = level1ImprovementTip(s);
  const shareText = challengeText(score, s.timed, s.expired);
  const shareMessage = `${shareText}\n${CHALLENGE_URL}`;
  async function copyChallenge() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(shareMessage);
      trackAiMasterEvent({
        name: 'challenge_share_action',
        share_method: 'clipboard',
      });
      setShareStatus('Challenge copied. Paste it into your Facebook post or message.');
      setShareFallback(false);
    } catch {
      setShareFallback(true);
      setShareStatus('Copy the text below manually to share your challenge.');
    }
  }
  async function shareChallenge() {
    if (typeof navigator.share !== 'function') { await copyChallenge(); return; }
    try {
      await navigator.share({ title: 'Techromz Play — AI Master', text: shareText, url: CHALLENGE_URL });
      trackAiMasterEvent({
        name: 'challenge_share_action',
        share_method: 'native_share',
      });
      setShareStatus('Share sheet closed. Your device will confirm if the post was sent.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      await copyChallenge();
    }
  }
  function openSocialShare(method: 'facebook' | 'whatsapp') {
    const destination = method === 'facebook'
      ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(CHALLENGE_URL)}&quote=${encodeURIComponent(shareText)}`
      : `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(destination, '_blank', 'noopener,noreferrer');
    trackAiMasterEvent({ name: 'challenge_share_action', share_method: method });
    setShareStatus(`${method === 'facebook' ? 'Facebook' : 'WhatsApp'} opened. Complete the share there.`);
  }
  function replay() {
    setShareStatus('');
    setShareFallback(false);
    setJustUnlocked(false);
    dispatch({ type: 'reset' });
  }

  function exitKnowledgeLab() {
    setJustUnlocked(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('level');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    dispatch({ type: 'reset' });
    setActiveLevel(1);
  }

  function enterKnowledgeLab() {
    if (!progress.level2Unlocked) {
      setAccessNotice('Complete Level 1 with at least 70/100 in timed or practice mode before entering the Knowledge Lab.');
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('level', '2');
    window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
    setAccessNotice('');
    setActiveLevel(2);
  }

  if (activeLevel === 2) {
    return <KnowledgeLab progress={progress} onExit={exitKnowledgeLab} onProgressChange={setProgress} />;
  }

  return (
    <section className={`${styles.lab} min-h-screen bg-[#0B1530] px-4 py-8 text-white sm:px-6 sm:py-14`}>
      <div className={`relative mx-auto ${s.phase === 'intro' ? 'max-w-6xl' : active ? 'max-w-5xl' : 'max-w-2xl'}`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold tracking-widest text-[#EAF1FF]">
          <Link href="/" onClick={(event) => { if (active && !window.confirm('Leave this active mission? Your current attempt will not be saved.')) event.preventDefault(); }} className="text-white underline underline-offset-4">← Back to All Games</Link>
          <span>{s.phase === 'intro' ? 'MISSION CONTROL' : 'MISSION 001'}</span>
        </div>
        <div className={`${styles.panel} rounded-[1.75rem] border border-white/20 bg-[#111F40]/95 p-5 shadow-xl backdrop-blur sm:p-8`}>
          {active && <div className="mb-6">
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-[#EAF1FF]">
              <span>Step {step} of 3</span>
              <span className="flex items-center gap-2 tabular-nums"><Clock size={18} aria-hidden="true" />{s.timed ? `00:${String(s.seconds).padStart(2, '0')}` : 'Practice mode'}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Mission progress" aria-valuemin={0} aria-valuemax={3} aria-valuenow={step}>
              <div className="h-full rounded-full bg-[#739DFF]" style={{ width: `${step / 3 * 100}%` }} />
            </div>
          </div>}
          {active && s.timed && <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs font-semibold text-[#EAF1FF]"><span>MISSION TIME</span><span>{s.seconds}s left</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Time remaining" aria-valuemin={0} aria-valuemax={30} aria-valuenow={s.seconds}>
              <div className={`${styles.timeBar} h-full rounded-full ${s.seconds <= 5 ? styles.urgent : 'bg-[#739DFF]'}`} style={{ width: `${s.seconds / 30 * 100}%` }} />
            </div>
          </div>}
          {s.phase === 'intro' && <MissionLobby
            level2Unlocked={progress.level2Unlocked}
            level1Completed={progress.completedLevels.includes(1)}
            level1Best={progress.bestScores.level1}
            level2Best={progress.bestScores.level2}
            accessNotice={accessNotice}
            onStartLevel1={(timed) => { setJustUnlocked(false); setAccessNotice(''); dispatch({ type: 'start', timed, now: Date.now() }); }}
            onStartLevel2={progress.level2Unlocked ? enterKnowledgeLab : undefined}
          />}
          {active && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
              {/* Left Column: AI Companion (compact at top on mobile, prominent on desktop) */}
              <div className="lg:col-span-5">
                <AiCompanion
                  responsive
                  role={s.role}
                  level={s.phase === 'role' ? (s.role ? 1 : 0) : s.phase === 'instructions' ? 2 : 3}
                />
              </div>

              {/* Right Column: Choices, Previews & Primary Actions */}
              <div className="lg:col-span-7">
                {s.phase === 'role' && <>
                  <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold text-white outline-none">01. Give your AI a role</h1>
                  <p className="mb-5 mt-2 text-[#EAF1FF]">Your mission: help a student prepare for an exam. Select the identity that best matches the task.</p>
                  <div className="space-y-3" role="radiogroup" aria-label="Select AI role">{roles.map(r => {
                    const selected = s.role === r.id;
                    return <button key={r.id} role="radio" aria-checked={selected} className={`${styles.choiceCard} ${selected ? styles.choiceSelected : ''} block w-full p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`} onClick={() => dispatch({ type: 'role', role: r.id, now: Date.now() })}>
                      <span className="flex items-center justify-between gap-3"><span className="text-base font-bold text-white">{r.label}</span>{selected && <CheckCircle size={20} className={styles.checkMark} aria-hidden="true" />}</span>
                      <span className="mt-1 block text-sm text-[#EAF1FF]">{r.detail}</span>
                    </button>;
                  })}</div>
                  <div className={`${styles.identityPreview} ${chosenRole ? styles.identityReady : ''} mt-4`} aria-live="polite">
                    <Bot size={21} aria-hidden="true" />
                    {chosenRole ? <span><strong className="block text-white">Identity ready: {chosenRole.label}</strong>{chosenRole.detail}</span> : <span><strong className="block text-white">AI identity not selected</strong>Choose one role to continue.</span>}
                  </div>
                  <button disabled={!s.role} className={`${primary} mt-5`} onClick={() => dispatch({ type: 'confirm-role', now: Date.now() })}>Confirm AI identity <ArrowRight size={19} aria-hidden="true" /></button>
                </>}
                {s.phase === 'instructions' && <>
                  <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold text-white outline-none">02. Build your instructions</h1>
                  <p className="mb-4 mt-2 text-[#EAF1FF]">Tap two instruction cards to configure your AI.</p>
                  <div className={`${styles.aiCore} mb-4 rounded-xl bg-[#0B1530] p-4 text-sm text-[#EAF1FF]`}>
                    <p className="mb-2 flex items-center gap-2 font-bold text-white"><Sparkles size={17} aria-hidden="true" /> AI instruction core</p>
                    <p>You are a {chosenRole?.label.toLowerCase()}.</p>
                    <div className="mt-2 flex min-h-8 flex-wrap gap-2">{s.selected.map(id => <span key={id} className={styles.coreChip}>+ {instructions.find(i => i.id === id)?.label}</span>)}</div>
                    {s.selected.length === 0 && <p className="mt-1 text-[#EAF1FF]">Add your instructions below.</p>}
                  </div>
                  <p className="mb-2 text-sm font-semibold text-[#EAF1FF]" aria-live="polite">{s.selected.length}/2 selected</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{instructions.map(i => {
                    const selected = s.selected.includes(i.id);
                    return <button key={i.id} aria-pressed={selected} disabled={!selected && s.selected.length === 2} onClick={() => dispatch({ type: 'toggle', id: i.id, now: Date.now() })} className={`${styles.instructionCard} ${selected ? styles.instructionLoaded : ''} min-h-[78px] rounded-xl border p-3 text-left text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50 ${selected ? 'border-[#2563EB] bg-[#1246AB]' : 'border-white/25 bg-white/5 hover:bg-white/10'}`}><span className="flex items-center gap-2">{selected && <CheckCircle size={18} className={styles.checkMark} aria-hidden="true" />}{i.label}</span><span className="mt-1 block text-xs font-normal text-[#EAF1FF]">{i.detail}</span></button>;
                  })}</div>
                  <button disabled={s.selected.length !== 2} className={`${primary} mt-5`} onClick={() => dispatch({ type: 'test', now: Date.now() })}>Test my assistant <Sparkles size={19} aria-hidden="true" /></button>
                </>}
                {s.phase === 'test' && <>
                  <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold text-white outline-none">03. Test your creation</h1>
                  <p className="mt-2 text-sm text-[#EAF1FF]">Follow how your configuration turns an input into a simulated response.</p>
                  <div className={`${styles.simulationFlow} mt-5 rounded-xl bg-[#0B1530] p-4`} aria-label="Simulated AI test flow">
                    <div className={`${styles.flowStep} ${styles.flowInput}`}><strong>1 · STUDENT INPUT</strong><span>Help me prepare for my exam.</span></div>
                    <span className={styles.flowArrow} aria-hidden="true">→</span>
                    <div className={`${styles.flowStep} ${styles.flowProcess}`}><strong>2 · PROCESSING</strong><span className="flex items-center gap-2"><i className={styles.processingDot} />Applying role + 2 instructions</span></div>
                    <span className={styles.flowArrow} aria-hidden="true">→</span>
                    <div className={`${styles.flowStep} ${styles.flowAnswer}`}><strong className="flex items-center gap-2"><Bot size={17} aria-hidden="true" />3 · SIMULATED ANSWER</strong><span>{level1ResponseFor(s)}</span></div>
                  </div>
                  <p className="mb-3 mt-5 font-semibold text-white">What should you do before using this advice?</p>
                  <button className={primary} onClick={() => dispatch({ type: 'finish', verify: true, now: Date.now() })}>Check the answer and context</button>
                  <button className={`${secondary} mt-2`} onClick={() => dispatch({ type: 'finish', verify: false, now: Date.now() })}>Trust it without checking</button>
                </>}
              </div>
            </div>
          )}
          {s.phase === 'result' && <div className="text-center">
            {!s.expired && s.verified !== null && score === 100 && <PerfectVictory label="AI Master Level 1" />}
            <AiCompanion role={s.role} mood={!s.expired && score >= 70 ? 'celebrate' : 'encourage'} level={s.expired ? (s.tested ? 2 : s.role ? 1 : 0) : 3} />
            <div className={`${styles.celebration} mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2563EB]`}><Trophy className="text-white" size={34} aria-hidden="true" /></div>
            <p className="text-xs font-bold tracking-[.2em] text-[#9DBBFF]">MISSION REPORT</p>
            <h1 ref={heading} tabIndex={-1} className="mt-2 text-3xl font-black text-white outline-none sm:text-4xl">{s.expired ? 'Time is up!' : 'Level 1 Completed!'}</h1>
            <p className="mt-3 text-lg font-bold">Your Score: {score}/100</p>
            {justUnlocked && <p role="status" className={`${styles.celebration} mt-4 rounded-xl bg-[#1246AB] p-4 font-bold`}>Congratulations! Level 2 – AI Knowledge Lab Unlocked!</p>}
            {!progress.level2Unlocked && <p className="mt-3 text-[#EAF1FF]">{s.expired ? "Finish Level 1 and score" : "Score"} at least 70/100 to unlock Level 2.</p>}
            <div className={`${styles.scoreDial} mx-auto mt-6`}>
              <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full" aria-hidden="true"><circle cx="60" cy="60" r="53" fill="none" stroke="#ffffff20" strokeWidth="5" /><circle cx="60" cy="60" r="53" pathLength="100" fill="none" stroke="#9DBBFF" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${score} 100`} transform="rotate(-90 60 60)" /></svg>
              <p className={`${styles.scoreReveal} text-7xl font-black tabular-nums tracking-[-.06em] text-white`} aria-label={`${score} out of 100 points`}>{displayedScore}<span className="mt-1 block text-lg tracking-normal text-[#EAF1FF]">/ 100</span></p>
            </div>
            <div className={`${styles.badge} mx-auto mt-5 max-w-sm rounded-2xl border border-[#9DBBFF]/40 bg-[#1246AB]/50 p-4`}>
              <p className="flex items-center justify-center gap-2 text-xs font-bold tracking-[.16em] text-[#C9D9FF]"><Star size={15} fill="currentColor" /> ACHIEVEMENT UNLOCKED</p>
              <p className="mt-2 text-xl font-black text-white">{achievement.title}</p>
              <p className="mt-1 text-sm leading-6 text-[#EAF1FF]">{achievement.detail}</p>
            </div>
            <p className="mt-4 text-xs text-[#AFC6F6]">This score reflects your game choices, not a formal skills assessment.</p>
            <div className="my-5 space-y-2 rounded-xl bg-[#0B1530] p-4 text-left text-sm text-[#EAF1FF]">
              <p className="font-bold text-white">What makes an AI assistant useful?</p>
              <p>Role: match the assistant to the task. ({rolePoints}/20)</p>
              <p>Instructions: explain clearly and clarify missing information. ({instructionPoints}/50)</p>
              <p>Review: always check AI responses before relying on them. ({verificationPoints}/30)</p>
            </div>
            <div className={styles.improvementTip}><Sparkles size={20} aria-hidden="true" /><p><strong className="block text-white">Your next improvement</strong>{improvementTip}</p></div>
            <ScoreSharePanel game="AI Master" levelLabel="LEVEL 1 · AI MASTER" score={score} mode={s.timed ? '30-second Challenge' : 'Untimed Practice'} achievement={achievement.title} artwork="/images/institute/play/ai-master-robot-3d-v2.png" brandLogo="/images/institute/techromz-institute-logo-white-840.webp" publicUrl={CHALLENGE_URL} challengeMessage={shareText} completed={!s.expired && s.verified !== null} />
            <div className="mt-4 rounded-2xl border border-white/20 bg-gradient-to-br from-[#1246AB] to-[#17356D] p-5 text-left">
              <p className="text-xs font-bold tracking-widest text-[#EAF1FF]">KEEP LEARNING</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Ready to build a real AI assistant?</h2>
              <p className="mt-2 leading-7 text-[#EAF1FF]">Explore AI Kickstart at Techromz Institute of Technology.</p>
              <a href={`${getInstituteBaseUrl()}/institute/courses/build-your-first-ai-assistant`} target="_blank" rel="noopener noreferrer" onClick={() => trackAiMasterEvent({ name: 'course_clicked' })} className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-[#1246AB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Explore AI Kickstart at Institute <ArrowRight size={19} aria-hidden="true" /></a>
            </div>
            <div className="mt-4 rounded-2xl border border-white/15 bg-white/[.04] p-5 text-left">
              <div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">{progress.level2Unlocked ? <CheckCircle size={20} /> : <LockKeyhole size={20} />}</div><div><p className="text-xs font-bold tracking-[.14em] text-[#9DBBFF]">LEVEL 02 · {progress.level2Unlocked ? 'UNLOCKED' : 'SCORE 70 TO UNLOCK'}</p><h2 className="mt-1 text-lg font-black">AI Knowledge Lab</h2><p className="mt-1 text-sm text-[#C9D9FF]">{progress.level2Unlocked ? 'Milestone saved on this device. Your Knowledge Lab is ready for the next mission.' : 'Replay Level 1 and earn at least 70/100 in either mode.'}</p></div></div>
              {progress.level2Unlocked && <button className={`${primary} mt-4`} onClick={enterKnowledgeLab}>Play Level 2 <ArrowRight size={18} /></button>}
            </div>
            <button className={`${secondary} mt-4`} onClick={replay}><RotateCcw size={18} aria-hidden="true" /> Replay Level 1</button>
            <button className={`${secondary} mt-3`} onClick={exitKnowledgeLab}>Back to Missions</button>
          </div>}
        </div>
        <p className="mt-6 text-center text-sm text-[#EAF1FF]">Big ideas start with practical skills.</p>
      </div>
    </section>
  );
}
