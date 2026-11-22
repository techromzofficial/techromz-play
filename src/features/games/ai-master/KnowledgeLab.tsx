'use client';

import { useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle, Clock, Copy, Database, FileQuestion, FlaskConical, Gamepad2, LockKeyhole, Play, RefreshCcw, RotateCcw, Share2, ShieldCheck, Sparkles, Trophy, Wrench } from 'lucide-react';
import AiCompanion from './AiCompanion';
import LobbyRobot from './LobbyRobot';
import LabScoreMeter from './LabScoreMeter';
import { SourceHunt, CoreConfiguration, EvidenceChallenge, RepairLab } from './LabWorkbench';
import { evaluateLabRepair, type LabCitation, type RepairModuleId } from './labInteraction';
import { createLevel2InitialState, expectedLevel2TestSelection, isLevel2TestCorrect, level2Instructions, level2Reducer, level2Repairs, level2Sources, level2StageFeedback, level2Tests, scoreLevel2, type Level2AnswerId } from './levels/level2';
import { recordAiMasterResult, type AiMasterProgress } from './storage';
import { trackAiMasterEvent } from '../../analytics/instituteAnalytics';
import { getAiMasterShareUrl, getInstituteBaseUrl } from '@/config/site';
import styles from './KnowledgeLab.module.css';
import ScoreSharePanel from '../shared/ScoreSharePanel';
import PerfectVictory from './PerfectVictory';

type Props = {
  progress: AiMasterProgress;
  onExit: () => void;
  onProgressChange: (progress: AiMasterProgress) => void;
};

const primary = 'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1246AB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-45';
const secondary = 'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-45';
const LEVEL_2_SHARE_URL = getAiMasterShareUrl(2);
const briefingStages = [
  { icon: Database, title: 'Source Hunt', detail: 'Gather and connect trustworthy knowledge.', points: 30 },
  { icon: ShieldCheck, title: 'Core Configuration', detail: 'Install modules for safe AI behavior.', points: 20 },
  { icon: BookOpenCheck, title: 'Evidence Challenge', detail: 'Construct customer responses using connected evidence.', points: 30 },
  { icon: Wrench, title: 'Repair Lab', detail: 'Inspect and repair unsupported AI claims.', points: 20 },
];

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

function scoreBand(score: number): '0-39' | '40-69' | '70-79' | '80-100' {
  if (score >= 80) return '80-100';
  if (score >= 70) return '70-79';
  if (score >= 40) return '40-69';
  return '0-39';
}

export default function KnowledgeLab({ progress, onExit, onProgressChange }: Props) {
  const [state, dispatch] = useReducer(level2Reducer, undefined, createLevel2InitialState);
  const [feedback, setFeedback] = useState('');
  const [feedbackCorrect, setFeedbackCorrect] = useState(true);
  const [previewStage, setPreviewStage] = useState(0);
  const [shareStatus, setShareStatus] = useState('');
  const [shareFallback, setShareFallback] = useState(false);
  const active = state.phase !== 'briefing' && state.phase !== 'result';
  const heading = useRef<HTMLHeadingElement>(null);
  const labRoot = useRef<HTMLElement>(null);
  const [headerOffset, setHeaderOffset] = useState(0);
  const previousPhase = useRef(state.phase);
  const trackedStages = useRef({ sources: false, configuration: false, tests: 0, repair: false });
  const score = scoreLevel2(state);
  const stageFeedback = level2StageFeedback(state);
  const currentTest = level2Tests[state.currentTestIndex];

  useEffect(() => {
    const siteHeader = labRoot.current?.closest('main')?.previousElementSibling;
    if (!(siteHeader instanceof HTMLElement) || siteHeader.tagName !== 'HEADER') return;
    const measure = () => setHeaderOffset(Math.ceil(siteHeader.getBoundingClientRect().height));
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(siteHeader);
    window.addEventListener('resize', measure);
    return () => { observer?.disconnect(); window.removeEventListener('resize', measure); };
  }, []);

  useEffect(() => {
    if (state.phase !== 'briefing') heading.current?.focus();
  }, [state.phase, state.currentTestIndex]);

  useEffect(() => {
    if (state.deadline === null || state.phase === 'result' || state.phase === 'briefing') return;
    const timer = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 150);
    return () => window.clearInterval(timer);
  }, [state.deadline, state.phase]);

  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [active]);

  useEffect(() => {
    const previous = previousPhase.current;
    previousPhase.current = state.phase;
    if (previous !== 'result' && state.phase === 'result') {
      onProgressChange(recordAiMasterResult(2, state.mode, score.total, !state.expired && state.repairConfirmed, undefined, progress));
      trackAiMasterEvent({
        name: 'mission_complete',
        level: 2,
        game_mode: state.mode,
        completion: state.expired ? 'timeout' : 'completed',
        score_band: scoreBand(score.total),
      });
    }
  }, [state.phase, state.mode, state.expired, score.total, onProgressChange]);

  useEffect(() => {
    const tracked = trackedStages.current;
    if (state.sourcesConfirmed && !tracked.sources) {
      tracked.sources = true;
      trackAiMasterEvent({ name: 'stage_complete', level: 2, game_mode: state.mode, stage: 'sources', score_band: scoreBand(score.total) });
    }
    if (state.configurationConfirmed && !tracked.configuration) {
      tracked.configuration = true;
      trackAiMasterEvent({ name: 'stage_complete', level: 2, game_mode: state.mode, stage: 'configuration', score_band: scoreBand(score.total) });
    }
    while (tracked.tests < state.confirmedTests.length) {
      const testNumber = tracked.tests + 1;
      tracked.tests = testNumber;
      trackAiMasterEvent({ name: 'stage_complete', level: 2, game_mode: state.mode, stage: testNumber === 1 ? 'test_1' : 'test_2', score_band: scoreBand(score.total) });
    }
    if (state.repairConfirmed && !tracked.repair) {
      tracked.repair = true;
      trackAiMasterEvent({ name: 'stage_complete', level: 2, game_mode: state.mode, stage: 'repair', score_band: scoreBand(score.total) });
    }
  }, [state.sourcesConfirmed, state.configurationConfirmed, state.confirmedTests.length, state.repairConfirmed, state.mode, score.total]);

  const stage = state.phase === 'sources' ? 1 : state.phase === 'configure' ? 2 : state.phase === 'tests' ? 3 : 4;

  function start(mode: 'timed' | 'practice') {
    setFeedback('');
    trackedStages.current = { sources: false, configuration: false, tests: 0, repair: false };
    dispatch({ type: 'start', mode, now: Date.now() });
    trackAiMasterEvent({ name: 'mission_start', level: 2, game_mode: mode });
  }

  function confirmSources() {
    const points = state.selectedSources.reduce((total, id) => total + (level2Sources.find((source) => source.id === id)?.points ?? 0), 0);
    setFeedbackCorrect(points === 30);
    setFeedback(points === 30 ? 'Sources secured: both are current and authoritative.' : 'Sources confirmed. Current official evidence is more reliable than old or unverified claims.');
    dispatch({ type: 'confirm-sources', now: Date.now() });
  }

  function confirmConfiguration() {
    const points = state.selectedInstructions.reduce((total, id) => total + (level2Instructions.find((instruction) => instruction.id === id)?.points ?? 0), 0);
    setFeedbackCorrect(points === 20);
    setFeedback(points === 20 ? 'Configuration loaded: the assistant will use evidence and communicate uncertainty.' : 'Configuration loaded. Reliable assistants should avoid guesses and unsupported promises.');
    dispatch({ type: 'confirm-configuration', now: Date.now() });
  }

  function confirmTest(answerDraft: Level2AnswerId, sourceDraft: LabCitation, responseText: string) {
    if (!currentTest || !answerDraft || !sourceDraft) return;
    const sourceId = sourceDraft === 'none' ? null : sourceDraft;
    const expected = expectedLevel2TestSelection(state, currentTest.id);
    const correct = answerDraft === expected.answerId && sourceId === expected.sourceId;
    setFeedbackCorrect(correct);
    setFeedback(correct ? 'Grounded test passed: the answer matches the knowledge available to your assistant.' : 'Test recorded. A grounded response needs both a supported claim and the matching selected source.');
    dispatch({ type: 'select-test-answer', testId: currentTest.id, answerId: answerDraft, sourceId, responseText, now: Date.now() });
    dispatch({ type: 'confirm-test', testId: currentTest.id, now: Date.now() });
  }

  function confirmRepair(modules: [RepairModuleId | null, RepairModuleId | null], flagged: boolean) {
    const repair = evaluateLabRepair(modules, flagged);
    const correct = repair === 'request-verified-update';
    setFeedbackCorrect(correct);
    setFeedback(correct ? 'Repair complete: the assistant acknowledged missing evidence and requested a verified update.' : 'Repair recorded. Missing evidence should be acknowledged instead of replaced with a guess.');
    dispatch({ type: 'select-repair', id: repair, now: Date.now() });
    dispatch({ type: 'confirm-repair', now: Date.now() });
  }

  function replay() {
    trackAiMasterEvent({ name: 'replay', level: 2, game_mode: state.mode });
    setFeedback('');
    setShareStatus('');
    setShareFallback(false);
    dispatch({ type: 'reset' });
  }

  const shareText = `I scored ${score.total}/100 in the Techromz AI Knowledge Lab${state.mode === 'timed' ? ' 90-second challenge' : ' practice mode'}. Can you build a grounded AI assistant? (Player-reported score.)`;
  const shareMessage = `${shareText}\n${LEVEL_2_SHARE_URL}`;

  async function copyResult() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(shareMessage);
      trackAiMasterEvent({ name: 'share_click', level: 2, game_mode: state.mode, share_method: 'clipboard' });
      setShareStatus('Result copied. Paste it into your preferred app.');
      setShareFallback(false);
    } catch {
      setShareFallback(true);
      setShareStatus('Copy the result text below manually.');
    }
  }

  async function shareResult() {
    if (typeof navigator.share !== 'function') {
      await copyResult();
      return;
    }
    try {
      await navigator.share({ title: 'AI Knowledge Lab · Techromz Play', text: shareText, url: LEVEL_2_SHARE_URL });
      trackAiMasterEvent({ name: 'share_click', level: 2, game_mode: state.mode, share_method: 'native_share' });
      setShareStatus('Share sheet closed. Your device will confirm whether it was sent.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      await copyResult();
    }
  }

  const unfinished = [
    !state.sourcesConfirmed && 'Source selection',
    !state.configurationConfirmed && 'Assistant configuration',
    state.confirmedTests.length < 2 && 'Knowledge tests',
    !state.repairConfirmed && 'Unsupported-answer repair',
  ].filter(Boolean) as string[];

  return (
    <section ref={labRoot} className={styles.lab} style={{ '--institute-header-height': `${headerOffset}px` } as CSSProperties}>
      <div className={styles.labEnvironment} aria-hidden="true"><span /><span /><span /></div>
      <div className={styles.labContainer}>
        <nav className={styles.topNav} aria-label="Knowledge Lab navigation">
          <button onClick={onExit}><ArrowLeft size={20} aria-hidden="true" /><span>MISSION CONTROL</span></button>
          <Link href="/" onClick={(event) => { if (active && !window.confirm('Leave this active mission? Your current attempt will not be saved.')) event.preventDefault(); }}>← Back to All Games</Link>
          <span>LEVEL 02 · AI KNOWLEDGE LAB <i className={styles.onlineIndicator} aria-hidden="true" /></span>
        </nav>
        <div className={styles.shell}>
          {active && <header className={styles.missionHeader}>
            <div><p className={styles.eyebrow}>TECH SHOP RELIABILITY MISSION</p><h1 ref={heading} tabIndex={-1}>Stage {stage} of 4 – {briefingStages[stage - 1].title}</h1></div>
            <div className={styles.hudStats}><span><Clock size={19} aria-hidden="true" />{state.mode === 'timed' ? formatTime(state.seconds) : 'Practice · Untimed'}</span><span><Trophy size={18} aria-hidden="true" />{score.total}/100 <small>confirmed</small></span></div>
            <ol className={styles.journeyTrack} aria-label="Mission stage progress">{briefingStages.map((item, index) => <li key={item.title} aria-current={stage === index + 1 ? 'step' : undefined} className={stage > index + 1 ? styles.stageDone : stage === index + 1 ? styles.stageCurrent : ''}><span>{stage > index + 1 ? <CheckCircle size={18} aria-hidden="true" /> : index + 1}</span><strong>{item.title}</strong></li>)}</ol>
          </header>}
          {feedback && active && <div className={styles.feedback} role="status">{feedbackCorrect ? <CheckCircle size={19} aria-hidden="true" /> : <FileQuestion size={19} aria-hidden="true" />}<span>{feedback}</span></div>}
          {state.phase === 'briefing' && <div className={styles.briefing}>
            <div className={styles.heroRobot}><LobbyRobot /><div className={styles.hologram}><FlaskConical size={30} aria-hidden="true" /><span>LOCAL AI ENGINEERING LAB<small>Knowledge + behavior + evidence</small></span></div></div>
            <div className={styles.heroCopy}><span className={styles.levelPill}>LEVEL 02 · READY TO LAUNCH</span><h1>AI Knowledge Lab</h1><h2>Build a Trustworthy AI Assistant</h2><p>Enter the AI Knowledge Lab and create a reliable AI assistant for a fictional technology shop. Connect trusted knowledge, configure intelligent behavior, test real-world scenarios, and fix unsupported responses.</p>
              <ol className={styles.missionPreviews}>{briefingStages.map((item, index) => { const Icon = item.icon; return <li key={item.title}><button aria-pressed={previewStage === index} onClick={() => setPreviewStage(index)}><Icon size={27} aria-hidden="true" /><small>MISSION {String(index + 1).padStart(2, '0')}</small><strong>{item.title}</strong><span>{item.points} Points</span></button></li>; })}</ol>
              <p className={styles.previewDetail} role="status">{briefingStages[previewStage].detail} <span>Four sequential stages · 100 points total · Mastery at 80+</span></p>
              <div className={styles.launchActions}><button className={styles.primaryAction} onClick={() => start('timed')}><Play size={22} aria-hidden="true" /><span>Start Timed Challenge<small>90 seconds · 100 points</small></span><ArrowRight size={20} aria-hidden="true" /></button><button className={styles.secondaryAction} onClick={() => start('practice')}><Gamepad2 size={24} aria-hidden="true" /><span>Practice Mode<small>No time limit · learn at your pace</small></span></button></div>
              <p className={styles.simulationNote}>Fictional, deterministic simulation. No live AI or real customer data.</p>
            </div>
          </div>}
          {state.phase === 'sources' && <SourceHunt state={state} onPlace={(slot, id) => dispatch({ type: 'place-source', slot, id, now: Date.now() })} onConfirm={confirmSources} />}
          {state.phase === 'configure' && <CoreConfiguration state={state} onPlace={(slot, id) => dispatch({ type: 'place-instruction', slot, id, now: Date.now() })} onConfirm={confirmConfiguration} />}
          {state.phase === 'tests' && <EvidenceChallenge key={currentTest.id} state={state} onSubmit={confirmTest} />}
          {state.phase === 'improve' && <RepairLab state={state} onSubmit={confirmRepair} />}
          {state.phase === 'result' && <div className={styles.results}>
            {!state.expired && state.repairConfirmed && score.total === 100 && <PerfectVictory label="AI Knowledge Lab Level 2" />}
            <div className={styles.victoryHeader}><div className={styles.victoryCompanion}>
            <AiCompanion responsive level={3} mood={!state.expired && score.total >= 80 ? 'celebrate' : 'encourage'} />
            <div className={styles.resultIcon}><Trophy size={35} aria-hidden="true" /></div>
            </div><div className={styles.victorySummary}>
            <p className="text-xs font-bold tracking-[.18em] text-[#9DBBFF]">LEVEL 02 · MISSION REPORT</p>
            {!state.expired && score.total >= 80 && <div className={styles.confetti} aria-hidden="true">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ left: `${index * 8 + 4}%`, animationDelay: `${index % 3 * 60}ms` }} />)}</div>}
            <h1 ref={heading} tabIndex={-1} className="mt-2 text-4xl font-black outline-none">{state.expired ? 'Lab time expired' : 'Level 2 Completed!'}</h1>
            <p className={styles.coreState}>AI Core · {state.repairConfirmed && score.repairPoints === 20 ? 'Repaired' : state.expired ? 'Attempt paused — unfinished tasks below' : 'Response complete — review your evidence'}</p>
            <LabScoreMeter score={score.total} />
            <p className={styles.personalBest}>Personal best · {state.mode === 'timed' ? 'Timed Challenge' : 'Practice'}: {progress.bestScores.level2[state.mode]}/100</p>
            <div className={styles.mastery}>{!state.expired && state.repairConfirmed && score.total >= 80 ? <><Sparkles size={19} /><span><strong>AI Knowledge Lab Mastery</strong>Badge earned</span></> : <><RefreshCcw size={19} /><span><strong>KEEP EXPERIMENTING</strong>Complete all stages with 80 or more to earn mastery</span></>}</div>
            </div></div>
            {state.expired && unfinished.length > 0 && <div className={styles.unfinished}><strong>Unfinished tasks</strong><ul>{unfinished.map((item) => <li key={item}>{item}</li>)}</ul></div>}
            <div className={styles.breakdown}>
              {[
                ['Sources', score.sourcePoints, 30, stageFeedback.sources],
                ['Configuration', score.configurationPoints, 20, stageFeedback.configuration],
                ['Tests', score.testPoints, 30, stageFeedback.tests],
                ['Repair', score.repairPoints, 20, stageFeedback.repair],
              ].map(([label, points, maximum, detail]) => <article key={String(label)}><div><strong>{String(label)}</strong><span>{String(points)}/{String(maximum)}</span></div><p>{String(detail)}</p></article>)}
            </div>
            <div className={styles.resultActions}><button className={primary} onClick={replay}><RotateCcw size={18} /> Replay Level 2</button><button className={secondary} onClick={onExit}><ArrowLeft size={18} /> Back to Missions</button>
            <a href={`${getInstituteBaseUrl()}/institute/courses/build-an-ai-knowledge-assistant?utm_source=techromz_play&utm_medium=organic_social&utm_campaign=ai_knowledge_lab`} target="_blank" rel="noopener noreferrer" onClick={() => trackAiMasterEvent({ name: 'course_cta_click', level: 2, game_mode: state.mode })} className="mx-auto mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 font-bold text-[#EAF1FF] underline underline-offset-4">Explore AI Knowledge Lab course <ArrowRight size={17} /></a></div>
            <section className={styles.decisionReview} aria-labelledby="decision-review">
              <h2 id="decision-review" className="text-xl font-bold">Your decisions</h2>
              <ul>
                {level2Sources.filter(item => state.selectedSources.includes(item.id)).map(item => <li key={item.id}><strong>{item.title}: {state.sourcesConfirmed ? item.points ? 'Correct' : 'Incorrect' : 'Unconfirmed'}</strong><p>{item.content}</p></li>)}
                {level2Instructions.filter(item => state.selectedInstructions.includes(item.id)).map(item => <li key={item.id}><strong>{item.title}: {state.configurationConfirmed ? item.points ? 'Correct' : 'Incorrect' : 'Unconfirmed'}</strong><p>{item.detail}</p></li>)}
                {level2Tests.map(test => {
                  const choice = state.testSelections[test.id];
                  const expected = expectedLevel2TestSelection(state, test.id);
                  return <li key={test.id}><strong>{test.question} — {state.confirmedTests.includes(test.id) ? isLevel2TestCorrect(state, test.id) ? 'Correct' : 'Incorrect' : 'Unfinished'}</strong>
                    <p>Your answer: {choice?.responseText ?? test.answers.find(answer => answer.id === choice?.answerId)?.text ?? 'Not selected'} Citation: {level2Sources.find(source => source.id === choice?.sourceId)?.title ?? 'No source'}.</p>
                    <p>Supported answer: {test.answers.find(answer => answer.id === expected.answerId)?.text} Citation: {level2Sources.find(source => source.id === expected.sourceId)?.title ?? 'No source'}.</p>
                  </li>;
                })}
                <li><strong>Model C repair: {state.repairConfirmed ? score.repairPoints ? 'Correct' : 'Incorrect' : 'Unfinished'}</strong><p>{level2Repairs.find(item => item.id === state.repairSelection)?.text ?? 'Not selected'}</p><p>Request verified information before answering about an unlisted model.</p></li>
              </ul>
            </section>
            <p className="mt-5 font-bold text-[#EAF1FF]"><LockKeyhole className="inline" size={17} aria-hidden="true" /> LEVEL 03 – AI LAUNCHPAD · COMING SOON</p>
            <p className="mt-5 text-xs text-[#AFC6F6]">This result reflects fictional game decisions, not an academic certificate or employment qualification.</p>
            <div className="mt-6 rounded-2xl border border-white/15 bg-white/[.04] p-5"><h2 className="text-xl font-black">Ready to build a real AI knowledge assistant?</h2><p className="mt-2 text-sm text-[#EAF1FF]">Explore AI Knowledge Lab at Techromz Institute of Technology.</p></div>
            <ScoreSharePanel game="AI Knowledge Lab" levelLabel="LEVEL 2 · AI KNOWLEDGE LAB" score={score.total} mode={state.mode === 'timed' ? '90-second Challenge' : 'Untimed Practice'} achievement={!state.expired && state.repairConfirmed && score.total >= 80 ? 'AI Knowledge Lab Mastery' : 'Knowledge Lab Explorer'} artwork="/images/institute/play/ai-master-robot-3d-v2.png" brandLogo="/images/institute/techromz-institute-logo-white-840.webp" publicUrl={LEVEL_2_SHARE_URL} challengeMessage={shareText} completed={!state.expired && state.repairConfirmed} />

          </div>}
        </div>
      </div>
    </section>
  );
}
