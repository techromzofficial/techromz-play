import { ArrowRight, BrainCircuit, Clock3, FlaskConical, LockKeyhole, Rocket, ShieldCheck, Sparkles } from 'lucide-react';
import LobbyRobot from './LobbyRobot';
import styles from './MissionLobby.module.css';

type Props = {
  level2Unlocked?: boolean;
  level1Completed?: boolean;
  level1Best?: { timed: number; practice: number };
  level2Best?: { timed: number; practice: number };
  accessNotice?: string;
  onStartLevel1: (timed: boolean) => void;
  onStartLevel2?: () => void;
};

const primaryButton = 'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1246AB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white';
const secondaryButton = 'inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white';

function bestScoreLabel(score: number) {
  return score > 0 ? `${score}/100` : 'Not played';
}

export default function MissionLobby({
  level2Unlocked = false,
  level1Completed = false,
  level1Best = { timed: 0, practice: 0 },
  level2Best = { timed: 0, practice: 0 },
  accessNotice = '',
  onStartLevel1,
  onStartLevel2,
}: Props) {
  return (
    <div className={styles.lobby}>
      <div className={styles.heroGrid}>
        <div className={styles.companionWake}>
          <LobbyRobot />
        </div>
        <div className={styles.introduction}>
          <p className="text-xs font-bold tracking-[.22em] text-[#9DBBFF]">TECHROMZ PLAY · AI LEARNING JOURNEY</p>
          <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">AI Master</h1>
          <p className="mt-4 text-xl font-bold text-[#EAF1FF] sm:text-2xl">Build, test and improve reliable AI assistants.</p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#EAF1FF]">Learn practical AI skills through short simulated missions. Start with a role and clear instructions, then progress into verified knowledge and grounded answers.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-[#EAF1FF]">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-2"><ShieldCheck size={16} aria-hidden="true" /> Simulated and safe</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-2"><Sparkles size={16} aria-hidden="true" /> No account needed</span>
          </div>
        </div>
      </div>

      <section className="mt-8" aria-labelledby="mission-heading">
        {accessNotice && <div className={styles.accessNotice} role="status"><LockKeyhole size={18} aria-hidden="true" /><span><strong>Mission access</strong>{accessNotice}</span></div>}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-[.18em] text-[#9DBBFF]">MISSION CONTROL</p>
            <h2 id="mission-heading" className="mt-1 text-2xl font-black text-white">Choose your next challenge</h2>
          </div>
          <p className="text-sm font-semibold text-[#EAF1FF]">3-level learning journey</p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <article className={`${styles.missionCard} ${styles.levelOne}`}>
            <div className="flex items-start justify-between gap-3">
              <span className={styles.icon}><BrainCircuit size={24} aria-hidden="true" /></span>
              <span className={styles.available}>{level1Completed ? 'COMPLETED' : 'AVAILABLE'}</span>
            </div>
            <p className="mt-5 text-xs font-bold tracking-[.16em] text-[#9DBBFF]">LEVEL 01 · AI KICKSTART</p>
            <h3 className="mt-2 text-2xl font-black text-white">AI Kickstart</h3>
            <p className="mt-2 min-h-[72px] text-sm leading-6 text-[#EAF1FF]">Choose the right role, add two useful instructions and verify the assistant’s advice.</p>
            <div className="my-5 grid grid-cols-3 gap-2 text-center text-xs font-bold text-[#EAF1FF]">
              <span className={styles.stat}>3 stages</span>
              <span className={styles.stat}>100 pts</span>
              <span className={styles.stat}>Beginner</span>
            </div>
            <button className={primaryButton} onClick={() => onStartLevel1(true)}>{level1Completed ? 'Replay' : 'Play'} 30-second mission <ArrowRight size={18} aria-hidden="true" /></button>
            <button className={`${secondaryButton} mt-2`} onClick={() => onStartLevel1(false)}><Clock3 size={18} aria-hidden="true" /> Practise without timer</button>
            <p className={styles.personalBest}><strong>Personal best</strong><span>Timed: {bestScoreLabel(level1Best.timed)}</span><span>Practice: {bestScoreLabel(level1Best.practice)}</span></p>
          </article>

          <article className={`${styles.missionCard} ${level2Unlocked ? styles.levelTwoUnlocked : styles.lockedCard}`}>
            <div className="flex items-start justify-between gap-3">
              <span className={styles.icon}><FlaskConical size={24} aria-hidden="true" /></span>
              <span className={level2Unlocked ? styles.available : styles.locked}>{level2Unlocked ? 'UNLOCKED' : <><LockKeyhole size={13} aria-hidden="true" /> LOCKED</>}</span>
            </div>
            <p className="mt-5 text-xs font-bold tracking-[.16em] text-[#9DBBFF]">LEVEL 02 · AI KNOWLEDGE LAB</p>
            <h3 className="mt-2 text-2xl font-black text-white">AI Knowledge Lab</h3>
            <p className="mt-2 min-h-[72px] text-sm leading-6 text-[#EAF1FF]">Select trusted knowledge, configure safe behaviour and repair unsupported answers.</p>
            <div className="my-5 grid grid-cols-3 gap-2 text-center text-xs font-bold text-[#EAF1FF]">
              <span className={styles.stat}>4 stages</span>
              <span className={styles.stat}>100 pts</span>
              <span className={styles.stat}>Explorer</span>
            </div>
            {level2Unlocked && onStartLevel2 ? (
              <button className={primaryButton} onClick={onStartLevel2}>Enter knowledge lab <ArrowRight size={18} aria-hidden="true" /></button>
            ) : level2Unlocked ? (
              <div className={styles.requirement} role="status">
                <ShieldCheck size={18} aria-hidden="true" />
                <span><strong className="block text-white">Knowledge Lab unlocked</strong>Your Level 2 access is saved on this device.</span>
              </div>
            ) : (
              <div className={styles.requirement} role="note">
                <LockKeyhole size={18} aria-hidden="true" />
                <span><strong className="block text-white">Unlock requirement</strong>Score at least 70/100 in Level 1 to unlock.</span>
              </div>
            )}
            {!level2Unlocked && <button disabled className={`${secondaryButton} mt-3 disabled:cursor-not-allowed disabled:opacity-50`}>Play Level 2 · Locked</button>}
            <p className={styles.personalBest}><strong>Personal best</strong><span>Timed: {bestScoreLabel(level2Best.timed)}</span><span>Practice: {bestScoreLabel(level2Best.practice)}</span></p>
          </article>

          <article className={`${styles.missionCard} ${styles.lockedCard}`}>
            <div className="flex items-start justify-between gap-3">
              <span className={styles.icon}><Rocket size={24} aria-hidden="true" /></span>
              <span className={styles.locked}><LockKeyhole size={13} aria-hidden="true" /> COMING SOON</span>
            </div>
            <p className="mt-5 text-xs font-bold tracking-[.16em] text-[#9DBBFF]">LEVEL 03 · AI LAUNCHPAD</p>
            <h3 className="mt-2 text-2xl font-black text-white">AI Launchpad</h3>
            <p className="mt-2 min-h-[72px] text-sm leading-6 text-[#EAF1FF]">A future advanced mission for planning, testing and presenting a complete AI solution.</p>
            <div className="my-5 grid grid-cols-3 gap-2 text-center text-xs font-bold text-[#EAF1FF]">
              <span className={styles.stat}>Future</span>
              <span className={styles.stat}>Advanced</span>
              <span className={styles.stat}>Locked</span>
            </div>
            <div className={styles.requirement} role="note">
              <LockKeyhole size={18} aria-hidden="true" />
              <span><strong className="block text-white">Not available in this release</strong>Level 3 remains locked while the learning journey grows.</span>
            </div>
            <button disabled className={`${secondaryButton} mt-3 disabled:cursor-not-allowed disabled:opacity-50`}>Play Level 3 · Coming Soon</button>
          </article>
        </div>
      </section>

      <p className="mt-6 text-center text-xs leading-6 text-[#AFC6F6]">All missions are fictional, deterministic simulations designed for learning. No live AI service is used.</p>
    </div>
  );
}
