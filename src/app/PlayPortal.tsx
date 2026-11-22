'use client';

import { useEffect, useState } from 'react';
import { AppWindow, ArrowRight, Bot, Check, Clock3, Gamepad2, LockKeyhole, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import RetailRushEntry from '@/features/games/retail-rush/RetailRushEntry';
import { LEVEL_2_UNLOCK_SCORE, loadAiMasterProgress } from '@/features/games/ai-master/storage';
import styles from './PlayLanding.module.css';

export default function PlayPortal() {
  const [aiProgress, setAiProgress] = useState<{ unlocked: boolean; best: number } | null>(null);

  useEffect(() => {
    const progress = loadAiMasterProgress();
    setAiProgress({
      unlocked: progress.level2Unlocked,
      best: Math.max(progress.bestScores.level1.timed, progress.bestScores.level1.practice),
    });
  }, []);

  const level2Unlocked = aiProgress?.unlocked === true;

  return (
    <main className={styles.page}>
      <section className={styles.intro} aria-labelledby="play-title">
        <div className={styles.eyebrow}><Gamepad2 size={17} aria-hidden="true" /> Techromz Play</div>
        <h1 id="play-title">Choose Your Game.</h1>
        <p className={styles.tagline}>Think. Play. Innovate.</p>
        <p className={styles.introCopy}>Three practical technology missions. Pick a game, see what is available, and start playing.</p>
        <nav className={styles.gameIndex} aria-label="Games on this page">
          <a href="#ai-master"><Bot size={17} aria-hidden="true" /><span>AI Master</span></a>
          <a href="#retail-rush"><ShoppingCart size={17} aria-hidden="true" /><span>Retail Rush</span></a>
          <a href="#app-builder"><AppWindow size={17} aria-hidden="true" /><span>App Builder</span></a>
        </nav>
      </section>

      <section className={styles.gamesSection} aria-label="Choose a Techromz Play game">
        <div className={styles.gameGrid}>
          <article id="ai-master" className={styles.gameCard}>
            <div className={styles.artwork}>
              <Image src="/images/institute/play/ai-master-hero.webp" alt="AI Master robot in the Techromz Play learning arena" width={1400} height={876} priority sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw" />
              <span className={styles.mission}>Mission 001</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.titleRow}><span className={styles.icon}><Bot size={22} aria-hidden="true" /></span><h2>AI Master</h2></div>
              <p className={styles.description}>Build an AI assistant, test your AI knowledge, and improve your score through practical challenges.</p>
              <div className={styles.levels} aria-label="AI Master levels">
                <div className={styles.levelRow}><div><strong>Level 1</strong><span>AI Kickstart</span></div><span className={styles.available}><Check size={14} /> Play now</span></div>
                <div className={styles.levelRow}><div><strong>Level 2</strong><span>{level2Unlocked ? 'AI Knowledge Lab' : `Score ${LEVEL_2_UNLOCK_SCORE}+ in completed Level 1`}</span></div>{level2Unlocked ? <span className={styles.available}><Check size={14} /> Unlocked</span> : <span className={styles.locked}><LockKeyhole size={14} /> Locked</span>}</div>
                <div className={styles.levelRow}><div><strong>Level 3</strong><span>AI Launchpad</span></div><span className={styles.soon}><Clock3 size={14} /> Coming Soon</span></div>
              </div>
              {aiProgress && aiProgress.best > 0 && <p className={styles.savedProgress}>Your saved Level 1 best: <strong>{aiProgress.best}/100</strong></p>}
              <Link href={level2Unlocked ? '/ai-master?level=2' : '/ai-master'} className={styles.primaryAction}>{level2Unlocked ? 'Continue to Level 2' : 'Play Level 1'} <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
          </article>

          <article id="retail-rush" className={styles.gameCard}>
            <div className={styles.artwork}>
              <Image src="/images/institute/play/retail-rush-diorama.png" alt="Retail Rush store with aisles, customer, and checkout counter" width={1450} height={1086} sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw" />
              <span className={styles.mission}>Mission 002</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.titleRow}><span className={styles.icon}><ShoppingCart size={22} aria-hidden="true" /></span><h2>Retail Rush</h2></div>
              <p className={styles.description}>Manage your own retail store in 60 seconds. Serve customers, price products, and keep the shelves stocked.</p>
              <div className={styles.levels} aria-label="Retail Rush availability">
                <div className={styles.levelRow}><div><strong>Retail Rush</strong><span>60-second store challenge</span></div><span className={styles.available}><Check size={14} /> Play now</span></div>
              </div>
              <RetailRushEntry className={styles.primaryAction}>Play Retail Rush <ArrowRight size={18} aria-hidden="true" /></RetailRushEntry>
            </div>
          </article>

          <article id="app-builder" className={styles.gameCard}>
            <div className={styles.artwork}>
              <Image src="/images/play/app-builder/app-builder-card-3d-v1.png" alt="App Builder workspace connected to a Study Planner phone" width={1200} height={800} sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 33vw" />
              <span className={styles.mission}>Mission 003</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.titleRow}><span className={styles.icon}><AppWindow size={22} aria-hidden="true" /></span><h2>App Builder</h2></div>
              <p className={styles.description}>Build and test a Study Planner by designing its screen, connecting navigation, and adding button logic.</p>
              <div className={styles.levels} aria-label="App Builder levels">
                <div className={styles.levelRow}><div><strong>Level 1</strong><span>Study Planner</span></div><span className={styles.available}><Check size={14} /> Play now</span></div>
                <div className={styles.levelRow}><div><strong>Level 2</strong><span>New mission</span></div><span className={styles.soon}><Clock3 size={14} /> Coming Soon</span></div>
                <div className={styles.levelRow}><div><strong>Level 3</strong><span>New mission</span></div><span className={styles.soon}><Clock3 size={14} /> Coming Soon</span></div>
              </div>
              <Link href="/app-builder" className={styles.primaryAction}>Play Level 1 <ArrowRight size={18} aria-hidden="true" /></Link>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
