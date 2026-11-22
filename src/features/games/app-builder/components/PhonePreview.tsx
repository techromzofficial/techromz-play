import { ArrowLeft, BookOpen, Bug, Check, ChevronRight, Circle, Home, ListChecks, RotateCcw } from 'lucide-react';
import type { ComponentId, ScreenId, StageId, TaskStatus } from '../types';
import styles from '../AppBuilderGame.module.css';

type Props = {
  placed: ComponentId[];
  screen: ScreenId;
  status: TaskStatus;
  stage: StageId;
  navigationEnabled: boolean;
  logicEnabled: boolean;
  bugObserved: boolean;
  persistenceEnabled: boolean;
  onNavigate: (screen: ScreenId) => void;
  onMarkDone: () => void;
  onReset: () => void;
};

export default function PhonePreview({ placed, screen, status, stage, navigationEnabled, logicEnabled, bugObserved, persistenceEnabled, onNavigate, onMarkDone, onReset }: Props) {
  const has = (id: ComponentId) => placed.includes(id);
  return (
    <aside className={styles.previewPanel} aria-label="Live Study Planner phone preview">
      <div className={styles.previewHeading}>
        <div><span>LIVE PREVIEW</span><strong>{screen === 'home' ? 'Home' : 'Task Details'}</strong></div>
        <span className={styles.liveDot}>Live</span>
      </div>
      <div className={styles.previewControls} aria-label="Phone preview controls">
        <button className={screen === 'home' ? styles.previewControlActive : ''} onClick={() => onNavigate('home')} disabled={!navigationEnabled}><Home size={15} /> Home</button>
        <button className={screen === 'details' ? styles.previewControlActive : ''} onClick={() => onNavigate('details')} disabled={!navigationEnabled}><BookOpen size={15} /> Details</button>
        <button onClick={onReset} disabled={!logicEnabled} title="Reset the simulated task"><RotateCcw size={15} /> Reset</button>
      </div>
      {!navigationEnabled && <p className={styles.previewInstruction}>Complete the screen connection to unlock manual navigation.</p>}
      <div className={styles.phone}>
        <div className={styles.phoneTop}><span /><i /></div>
        <div className={styles.phoneScreen} key={screen}>
          {bugObserved && <div className={styles.phoneBugAlert} role="alert"><Bug size={15} /><span><strong>Bug detected</strong>Status reset during navigation.</span></div>}
          {stage === 4 && persistenceEnabled && !bugObserved && <div className={styles.phoneFixAlert}><Check size={15} /> Shared state repair applied</div>}
          {screen === 'home' ? (
            <>
              {has('title') ? <header className={styles.appHeader}><div className={styles.appIcon}><BookOpen size={18} /></div><div><small>MY WORKSPACE</small><h3>Study Planner</h3></div></header> : <div className={styles.emptySlot}>Drop an app header here</div>}
              {has('task-list') ? <button className={`${styles.taskCard} ${navigationEnabled ? styles.taskCardInteractive : ''}`} onClick={() => navigationEnabled && onNavigate('details')} disabled={!navigationEnabled} aria-label="Open task: Prepare tomorrow's study notes"><span className={status === 'Done' ? styles.doneIcon : styles.pendingIcon}>{status === 'Done' ? <Check size={16} /> : <Circle size={13} />}</span><span><strong>Prepare tomorrow&apos;s study notes</strong><small className={status === 'Done' ? styles.taskStatusDone : ''}>{status}</small>{navigationEnabled && <em>Tap to open details</em>}</span><ChevronRight size={18} aria-hidden="true" /></button> : <div className={styles.emptySlot}>Add a task list</div>}
              {has('done-button') ? <div className={styles.homeActionPreview}><ListChecks size={16} /> {status === 'Done' ? 'Task completion saved' : 'Mark Done action ready'}</div> : <div className={styles.emptySlot}>Add an action button</div>}
              {has('weather') && <div className={styles.distractorWidget}>Weather · 28° · Sunny</div>}
              {has('shop') && <div className={styles.distractorWidget}>Shopping cart · 0 items</div>}
              {has('social') && <div className={styles.distractorWidget}>Social updates</div>}
            </>
          ) : (
            <>
              <button className={styles.phoneBack} onClick={() => navigationEnabled && onNavigate('home')} disabled={!navigationEnabled}><ArrowLeft size={17} /> Back to Home</button>
              <div className={styles.detailsHero}><span><BookOpen size={20} /></span><small>STUDY TASK</small><h3>Prepare tomorrow&apos;s study notes</h3></div>
              <div className={styles.detailRow}><span>Status</span><strong key={status} className={status === 'Done' ? styles.statusDone : styles.statusPending} role="status" aria-live="polite">{status === 'Done' && <Check size={14} />}{status}</strong></div>
              <button className={styles.markDoneButton} disabled={!logicEnabled || status === 'Done'} onClick={onMarkDone}>{status === 'Done' ? <><Check size={18} /> Task completed</> : <><ListChecks size={18} /> Mark Done</>}</button>
              {status === 'Done' && <div className={styles.phoneSuccess} role="status"><Check size={16} /> Status updated successfully</div>}
              {!logicEnabled && <p className={styles.phoneHint}>Connect button logic in Stage 3.</p>}
            </>
          )}
        </div>
        <div className={styles.phoneHome} />
      </div>
      <p className={styles.previewNote}>Tap the phone or use the controls above to test your simulated app.</p>
    </aside>
  );
}
