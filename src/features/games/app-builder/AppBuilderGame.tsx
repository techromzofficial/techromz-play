'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Award, Bug, Check, ChevronRight, Clock3, Component, GitBranch, GripVertical, Lightbulb, Link2, ListChecks, Play, RotateCcw, Trash2, Wrench } from 'lucide-react';
import { trackAppBuilderEvent } from '@/features/analytics/playAnalytics';
import { COMPONENTS, emptyStageResults, STAGES } from './stages';
import { isPersistentFix, runDeterministicTest, validateConnections, validateDesign, validateLogic } from './engine';
import { applyStageValidation, earnsRookieBadge, scoreBand, totalScore } from './scoring';
import { bestForMode, loadProgress, saveResult } from './storage';
import { copyAppBuilderChallenge, shareAppBuilderScore } from './share';
import { CHALLENGE_DURATION_SECONDS, createChallengeDeadline, remainingChallengeSeconds } from './timer';
import type { AppBuilderMode, AppBuilderResult, ComponentId, ConnectionId, DebugFix, GameStatus, LogicAction, ScreenId, StageId, StageResults, TaskStatus } from './types';
import PhonePreview from './components/PhonePreview';
import ResultsPanel from './components/ResultsPanel';
import StageProgress from './components/StageProgress';
import styles from './AppBuilderGame.module.css';

const COMPLETE_COMPONENTS: ComponentId[] = ['title', 'task-list', 'done-button'];
type BestComparison = { previous: number; best: number; isNewBest: boolean };

export default function AppBuilderGame() {
  const searchParams = useSearchParams();
  const initialMode: AppBuilderMode = searchParams.get('mode') === 'practice' ? 'practice' : 'challenge';
  const [mode, setMode] = useState<AppBuilderMode>(initialMode);
  const [gameStatus, setGameStatus] = useState<GameStatus>('ready');
  const [stage, setStage] = useState<StageId>(1);
  const [results, setResults] = useState<StageResults>(emptyStageResults);
  const [placed, setPlaced] = useState<ComponentId[]>([]);
  const [connections, setConnections] = useState<ConnectionId[]>([]);
  const [badConnection, setBadConnection] = useState(false);
  const [logicAction, setLogicAction] = useState<LogicAction | null>(null);
  const [debugFix, setDebugFix] = useState<DebugFix | null>(null);
  const [screen, setScreen] = useState<ScreenId>('home');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Pending');
  const [bugObserved, setBugObserved] = useState(false);
  const [feedback, setFeedback] = useState('Choose the useful components, then arrange them in a clear screen order.');
  const [testPhase, setTestPhase] = useState<'idle' | 'running' | 'failed' | 'ready' | 'passed'>('idle');
  const [testStep, setTestStep] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(CHALLENGE_DURATION_SECONDS);
  const [shareFeedback, setShareFeedback] = useState('');
  const [stageReward, setStageReward] = useState<{ stage: StageId; concept: string; points: number } | null>(null);
  const [scoreDelta, setScoreDelta] = useState(0);
  const [bestComparison, setBestComparison] = useState<BestComparison | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const testTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rewardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);

  const score = totalScore(results);
  const current = STAGES[stage - 1];
  const gameActive = gameStatus === 'playing';
  const resultsVisible = gameStatus === 'completed' || gameStatus === 'expired';

  const finishRun = useCallback((nextResults: StageResults, timedOut: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const finalScore = totalScore(nextResults);
    const completed = !timedOut && Object.values(nextResults).every((item) => item.completed);
    const result: AppBuilderResult = {
      mode,
      score: finalScore,
      completed,
      timedOut,
      stagePoints: [nextResults[1].points, nextResults[2].points, nextResults[3].points, nextResults[4].points],
      finishedAt: new Date().toISOString(),
    };
    const previousBest = bestForMode(loadProgress(), mode);
    const savedProgress = saveResult(result);
    const savedBest = bestForMode(savedProgress, mode);
    setBestComparison({ previous: previousBest, best: savedBest, isNewBest: finalScore > previousBest });
    setGameStatus(timedOut ? 'expired' : 'completed');
    trackAppBuilderEvent({ name: 'app_builder_finish', game_mode: mode, game_score: finalScore, completion: timedOut ? 'timeout' : 'completed' });
  }, [mode]);

  useEffect(() => {
    if (!gameActive || mode !== 'challenge') return;
    const update = () => {
      if (deadlineRef.current === null) return;
      const remaining = remainingChallengeSeconds(deadlineRef.current, Date.now());
      setSecondsLeft(remaining);
      if (remaining === 0) finishRun(results, true);
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [finishRun, gameActive, mode, results]);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!gameActive) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [gameActive]);

  useEffect(() => () => {
    if (testTimerRef.current) clearTimeout(testTimerRef.current);
    if (rewardTimerRef.current) clearTimeout(rewardTimerRef.current);
  }, []);

  const resetRun = useCallback((nextMode: AppBuilderMode) => {
    if (testTimerRef.current) clearTimeout(testTimerRef.current);
    if (rewardTimerRef.current) clearTimeout(rewardTimerRef.current);
    setMode(nextMode);
    setGameStatus('ready');
    setStage(1);
    setResults(emptyStageResults());
    setPlaced([]);
    setConnections([]);
    setBadConnection(false);
    setLogicAction(null);
    setDebugFix(null);
    setScreen('home');
    setTaskStatus('Pending');
    setBugObserved(false);
    setFeedback('Choose the useful components, then arrange them in a clear screen order.');
    setTestPhase('idle');
    setTestStep(0);
    setSecondsLeft(CHALLENGE_DURATION_SECONDS);
    setShareFeedback('');
    setStageReward(null);
    setScoreDelta(0);
    setBestComparison(null);
    deadlineRef.current = null;
    finishedRef.current = false;
    trackAppBuilderEvent({ name: 'app_builder_replay', game_mode: nextMode });
  }, []);

  const startGame = () => {
    finishedRef.current = false;
    setGameStatus('playing');
    setSecondsLeft(CHALLENGE_DURATION_SECONDS);
    deadlineRef.current = mode === 'challenge' ? createChallengeDeadline(Date.now()) : null;
    trackAppBuilderEvent({ name: 'app_builder_start', game_mode: mode });
  };

  const submit = (valid: boolean, message: string) => {
    if (!gameActive || results[stage].completed) return;
    const nextResults = applyStageValidation(results, stage, valid);
    setResults(nextResults);
    setFeedback(message);
    if (!valid) return;
    const nextScore = totalScore(nextResults);
    const earnedPoints = nextResults[stage].points;
    setStageReward({ stage, concept: STAGES[stage - 1].concept, points: earnedPoints });
    setScoreDelta(earnedPoints);
    if (rewardTimerRef.current) clearTimeout(rewardTimerRef.current);
    rewardTimerRef.current = setTimeout(() => {
      setStageReward(null);
      setScoreDelta(0);
    }, 2200);
    trackAppBuilderEvent({ name: 'app_builder_stage_complete', game_mode: mode, stage, score_band: scoreBand(nextScore) });
    if (stage === 4) {
      setTestPhase('passed');
      finishRun(nextResults, false);
      return;
    }
    const nextStage = (stage + 1) as StageId;
    setStage(nextStage);
    if (nextStage === 2) setFeedback('Create both directions so the learner can open a task and return Home.');
    if (nextStage === 3) setFeedback('Choose what should happen when the Mark Done button is clicked.');
    if (nextStage === 4) {
      setFeedback('Run the diagnostic journey to reveal the scripted state bug.');
      setTaskStatus('Pending');
      setScreen('home');
      setBugObserved(false);
    }
  };

  const addComponent = (id: ComponentId) => {
    if (!gameActive || stage !== 1 || placed.includes(id)) return;
    setPlaced((items) => [...items, id]);
  };

  const moveComponent = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= placed.length) return;
    setPlaced((items) => { const next = [...items]; [next[index], next[target]] = [next[target], next[index]]; return next; });
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData('text/plain') as ComponentId;
    if (COMPONENTS.some((item) => item.id === id)) addComponent(id);
  };

  const toggleConnection = (id: ConnectionId) => {
    setConnections((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  };

  const navigatePreview = (next: ScreenId) => {
    if (next === 'home' && stage === 4 && taskStatus === 'Done') {
      if (!isPersistentFix(debugFix)) {
        setTaskStatus('Pending');
        setBugObserved(true);
        setFeedback('You reproduced the bug: returning Home reset Done back to Pending. Now find the state-preserving fix.');
      } else {
        setBugObserved(false);
        setFeedback('Manual test passed: the shared task state stayed Done after navigation.');
      }
    }
    setScreen(next);
  };

  const markPreviewTaskDone = () => {
    if (!gameActive) return;
    setTaskStatus('Done');
    setBugObserved(false);
    if (stage >= 3) setFeedback('The button event updated task state from Pending to Done. Return Home to test whether it persists.');
  };

  const resetPreview = () => {
    if (!gameActive) return;
    setScreen('home');
    setTaskStatus('Pending');
    setBugObserved(false);
    setFeedback('Phone preview reset. Open the task and test the interaction again.');
  };

  const runDiagnostic = () => {
    if (!gameActive || stage !== 4 || testPhase === 'running') return;
    setTestPhase('running');
    setTestStep(0);
    setScreen('home');
    setTaskStatus('Pending');
    setBugObserved(false);
    let index = 0;
    const result = runDeterministicTest(false);
    const advance = () => {
      const step = result.steps[index];
      setTestStep(index + 1);
      if (step.id === 'details') setScreen('details');
      if (step.id === 'mark-done') setTaskStatus('Done');
      if (step.id === 'back-home') { setScreen('home'); setTaskStatus(step.status); }
      index += 1;
      if (index < result.steps.length) testTimerRef.current = setTimeout(advance, 330);
      else {
        setTestPhase('failed');
        setBugObserved(true);
        setFeedback('Test failed: returning Home recreated the task with Pending status. Choose a state-preserving repair.');
      }
    };
    advance();
  };

  const runFinalTest = () => {
    if (!gameActive || stage !== 4 || testPhase === 'running' || !debugFix) return;
    setTestPhase('running');
    setTestStep(0);
    setScreen('home');
    setTaskStatus('Pending');
    setBugObserved(false);
    const persistent = isPersistentFix(debugFix);
    const result = runDeterministicTest(persistent);
    let index = 0;
    const advance = () => {
      const step = result.steps[index];
      setTestStep(index + 1);
      if (step.id === 'details') setScreen('details');
      if (step.id === 'mark-done') setTaskStatus('Done');
      if (step.id === 'back-home') { setScreen('home'); setTaskStatus(step.status); }
      index += 1;
      if (index < result.steps.length) testTimerRef.current = setTimeout(advance, 330);
      else if (result.passed) {
        setBugObserved(false);
        submit(true, 'All checks passed. Shared app state preserved Done across navigation.');
      }
      else {
        setTestPhase('failed');
        setBugObserved(true);
        submit(false, 'The test still fails. Animation and screen-local state cannot preserve data between screens.');
      }
    };
    advance();
  };

  const handleShare = async () => {
    const method = await shareAppBuilderScore(score, mode);
    if (method === 'unavailable') setShareFeedback('Sharing is unavailable in this browser. You can copy the page address manually.');
    else {
      setShareFeedback(method === 'clipboard' ? 'Score and challenge link copied.' : 'Share sheet opened.');
      trackAppBuilderEvent({ name: 'app_builder_share', game_mode: mode, share_method: method });
    }
  };

  const handleCopyChallenge = async () => {
    const copied = await copyAppBuilderChallenge(score, mode);
    setShareFeedback(copied ? 'Challenge text and link copied. Send it to a friend!' : 'Clipboard access is unavailable. Copy the page address from your browser.');
    if (copied) trackAppBuilderEvent({ name: 'app_builder_share', game_mode: mode, share_method: 'clipboard' });
  };

  const handleSocialShare = (network: 'facebook' | 'whatsapp') => {
    setShareFeedback(`${network === 'facebook' ? 'Facebook' : 'WhatsApp'} sharing opened in a new tab.`);
    trackAppBuilderEvent({ name: 'app_builder_share', game_mode: mode, share_method: network });
  };

  const selectedComponentNames = useMemo(() => placed.map((id) => COMPONENTS.find((item) => item.id === id)!).filter(Boolean), [placed]);

  if (resultsVisible) {
    return <ResultsPanel mode={mode} results={results} score={score} completed={gameStatus === 'completed'} badge={earnsRookieBadge(results)} bestComparison={bestComparison} onReplay={resetRun} onShare={handleShare} onCopy={handleCopyChallenge} onSocial={handleSocialShare} shareFeedback={shareFeedback} onCourseClick={() => trackAppBuilderEvent({ name: 'app_builder_course_click', game_mode: mode, score_band: scoreBand(score) })} />;
  }

  if (gameStatus === 'ready') {
    return (
      <main className={styles.readyPage}>
        <Link href="/" className={styles.backLink}><ArrowLeft size={17} /> Back to All Games</Link>
        <section className={styles.readyCard}>
          <div className={styles.readyIcon}><Component size={32} /></div>
          <span className={styles.missionTag}>MISSION 003 · LEVEL 1</span>
          <h1>Build Your First App</h1>
          <p>You are about to design and debug a simulated Study Planner through four hands-on stages.</p>
          <div className={styles.readyFacts}><span><Clock3 size={18} />{mode === 'challenge' ? '90 seconds total' : 'No time limit'}</span><span><ListChecks size={18} />4 stages · 100 points</span></div>
          <div className={styles.modeSwitch} aria-label="Choose game mode"><button className={mode === 'challenge' ? styles.modeActive : ''} onClick={() => setMode('challenge')}>90s Challenge</button><button className={mode === 'practice' ? styles.modeActive : ''} onClick={() => setMode('practice')}>Untimed Practice</button></div>
          <button className={styles.startButton} onClick={startGame}><Play size={19} /> Begin {mode === 'challenge' ? 'Challenge' : 'Practice'}</button>
          <p className={styles.startNote}>The timer starts only when you press Begin.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.gamePage}>
      <div className={styles.gameTopline}>
        <Link href="/" onClick={(event) => { if (gameActive && !window.confirm('Leave this active run? Your current attempt will not be saved.')) event.preventDefault(); }}><ArrowLeft size={17} /> Back to All Games</Link>
        <span>MISSION 003 · APP BUILDER</span>
      </div>
      <StageProgress mode={mode} currentStage={stage} results={results} score={score} secondsLeft={secondsLeft} celebratingStage={stageReward?.stage ?? null} scoreDelta={scoreDelta} />
      {stageReward && <div className={styles.stageReward} role="status" aria-live="polite"><span><Award size={23} /></span><div><small>STAGE {stageReward.stage} COMPLETE · +{stageReward.points} POINTS</small><strong>{stageReward.concept}</strong><p>Concept unlocked — great work!</p></div></div>}
      <div className={styles.workspace}>
        <section className={styles.builderPanel} aria-labelledby="stage-title">
          <header className={styles.stageHeader}><span>STAGE {String(stage).padStart(2, '0')} · {current.eyebrow.toUpperCase()}</span><h1 id="stage-title">{current.title}</h1><p>{current.objective}</p></header>

          {stage === 1 && <div className={styles.stageBody}>
            <div className={styles.sectionLabel}><Component size={17} /><div><strong>Component tray</strong><small>Tap “Add” or drag a card into the canvas.</small></div></div>
            <div className={styles.componentTray}>{COMPONENTS.map((item) => <article key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)} className={placed.includes(item.id) ? styles.componentUsed : ''}><GripVertical size={17} aria-hidden="true" /><div><strong>{item.label}</strong><small>{item.description}</small></div><button disabled={placed.includes(item.id)} onClick={() => addComponent(item.id)}>{placed.includes(item.id) ? 'Added' : 'Add'}</button></article>)}</div>
            <div className={styles.canvas} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}><div className={styles.sectionLabel}><ListChecks size={17} /><div><strong>Screen structure</strong><small>Arrange from top to bottom.</small></div></div>{selectedComponentNames.length === 0 ? <p className={styles.emptyCanvas}>Drop components here or use their Add buttons.</p> : <ol>{selectedComponentNames.map((item, index) => <li key={item.id}><span>{index + 1}</span><strong>{item.label}</strong><div><button onClick={() => moveComponent(index, -1)} disabled={index === 0} aria-label={`Move ${item.label} up`}><ArrowUp size={16} /></button><button onClick={() => moveComponent(index, 1)} disabled={index === placed.length - 1} aria-label={`Move ${item.label} down`}><ArrowDown size={16} /></button><button onClick={() => setPlaced((items) => items.filter((id) => id !== item.id))} aria-label={`Remove ${item.label}`}><Trash2 size={16} /></button></div></li>)}</ol>}</div>
            <button className={styles.validateButton} onClick={() => { const check = validateDesign(placed); submit(check.valid, check.message); }}>Check My Design <ChevronRight size={18} /></button>
          </div>}

          {stage === 2 && <div className={styles.stageBody}>
            <div className={styles.routeMap}><button className={styles.screenNode}>Home<small>Task list</small></button><div className={styles.routeLines}><span className={connections.includes('home-details') ? styles.routeOn : ''}>→</span><span className={connections.includes('details-home') ? styles.routeOn : ''}>←</span></div><button className={styles.screenNode}>Task Details<small>Task action</small></button></div>
            <p className={styles.routeHelp}>Select the directional connections your app needs.</p>
            <div className={styles.choiceGrid}><button className={connections.includes('home-details') ? styles.choiceSelected : ''} onClick={() => toggleConnection('home-details')}><Link2 size={18} />Home → Task Details</button><button className={connections.includes('details-home') ? styles.choiceSelected : ''} onClick={() => toggleConnection('details-home')}><Link2 size={18} />Task Details → Home</button><button className={badConnection ? styles.choiceSelected : ''} onClick={() => setBadConnection((value) => !value)}><RotateCcw size={18} />Home → Home</button></div>
            <button className={styles.validateButton} onClick={() => { const check = validateConnections(connections); submit(check.valid && !badConnection, badConnection ? 'A Home-to-Home loop does not open Task Details. Remove that route.' : check.message); }}>Test Navigation <ChevronRight size={18} /></button>
          </div>}

          {stage === 3 && <div className={styles.stageBody}>
            <div className={styles.logicFlow}><div><span>EVENT</span><strong>Mark Done clicked</strong></div><ArrowRight size={23} /><div className={logicAction ? styles.logicConfigured : ''}><span>ACTION</span><strong>{logicAction ? logicAction.replaceAll('-', ' ') : 'Choose an action'}</strong></div><ArrowRight size={23} /><div><span>RESULT</span><strong>{logicAction === 'update-status' ? 'Status = Done' : 'Waiting…'}</strong></div></div>
            <div className={styles.choiceGrid}><button className={logicAction === 'update-status' ? styles.choiceSelected : ''} onClick={() => setLogicAction('update-status')}><Check size={18} />Update Task Status → Done</button><button className={logicAction === 'delete-task' ? styles.choiceSelected : ''} onClick={() => setLogicAction('delete-task')}><Trash2 size={18} />Delete the task</button><button className={logicAction === 'duplicate-task' ? styles.choiceSelected : ''} onClick={() => setLogicAction('duplicate-task')}><Component size={18} />Duplicate the task</button></div>
            <button className={styles.validateButton} onClick={() => { const check = validateLogic(logicAction); if (check.valid) { setScreen('details'); setTaskStatus('Done'); } submit(check.valid, check.message); }}>Run Button Logic <ChevronRight size={18} /></button>
          </div>}

          {stage === 4 && <div className={styles.stageBody}>
            <div className={`${styles.testRunner} ${testPhase === 'failed' ? styles.testFailed : testPhase === 'passed' ? styles.testPassed : ''}`}><div><Bug size={21} /><div><strong>{testPhase === 'idle' ? 'Diagnostic ready' : testPhase === 'running' ? 'Running app journey…' : testPhase === 'failed' ? 'Bug reproduced' : testPhase === 'passed' ? 'All tests passed' : 'Repair selected'}</strong><small>{testPhase === 'running' ? `Check ${testStep} of 5` : 'Home → Details → Done → Home → Verify'}</small></div></div>{testPhase === 'idle' && <button onClick={runDiagnostic}><Play size={17} /> Run diagnostic</button>}</div>
            {(testPhase === 'failed' || testPhase === 'ready') && <><div className={styles.bugReport}><Bug size={18} /><p><strong>Failed assertion:</strong> expected Done after returning Home, received Pending. The Details screen stored status locally and lost it when navigation changed.</p></div><div className={styles.sectionLabel}><Wrench size={17} /><div><strong>Choose a repair</strong><small>Which change preserves the task state?</small></div></div><div className={styles.choiceGrid}><button className={debugFix === 'shared-app-state' ? styles.choiceSelected : ''} onClick={() => { setDebugFix('shared-app-state'); setTestPhase('ready'); setBugObserved(false); }}><GitBranch size={18} />Move status into shared app state</button><button className={debugFix === 'local-screen-state' ? styles.choiceSelected : ''} onClick={() => { setDebugFix('local-screen-state'); setTestPhase('ready'); }}><Component size={18} />Keep state inside Details</button><button className={debugFix === 'longer-animation' ? styles.choiceSelected : ''} onClick={() => { setDebugFix('longer-animation'); setTestPhase('ready'); }}><Clock3 size={18} />Make transition slower</button></div><button className={styles.validateButton} disabled={!debugFix} onClick={runFinalTest}><Play size={18} /> Apply Fix & Run Final Test</button></>}
          </div>}

          <div className={`${styles.feedback} ${results[stage].attempts > 0 && !results[stage].completed ? styles.feedbackError : ''}`} role="status"><Lightbulb size={19} /><p>{feedback}</p></div>
        </section>
        <PhonePreview placed={stage === 1 ? placed : COMPLETE_COMPONENTS} screen={screen} status={taskStatus} stage={stage} navigationEnabled={results[2].completed || stage >= 3} logicEnabled={results[3].completed || stage === 4} bugObserved={bugObserved} persistenceEnabled={isPersistentFix(debugFix)} onNavigate={navigatePreview} onMarkDone={markPreviewTaskDone} onReset={resetPreview} />
      </div>
    </main>
  );
}
