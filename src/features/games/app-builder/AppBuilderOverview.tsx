'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Clock3, Component, GitBranch, LockKeyhole, Play, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
import { getMobileKickstartUrl } from '@/config/site';
import { trackAppBuilderEvent } from '@/features/analytics/playAnalytics';
import styles from './AppBuilderOverview.module.css';

const stageCards = [
  { number: '01', title: 'Design', copy: 'Choose useful UI components and arrange a clear Study Planner screen.', icon: Component },
  { number: '02', title: 'Connect', copy: 'Link Home and Task Details with working two-way navigation.', icon: GitBranch },
  { number: '03', title: 'Program', copy: 'Wire Mark Done to a real task-status state change.', icon: Play },
  { number: '04', title: 'Debug', copy: 'Reproduce a reset bug, repair state, and rerun the test.', icon: Wrench },
];

export default function AppBuilderOverview() {
  useEffect(() => { trackAppBuilderEvent({ name: 'app_builder_view' }); }, []);
  const courseUrl = getMobileKickstartUrl('overview_cta');
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.crumbs}><Link href="/">← Back to All Games</Link><span>/</span><span>App Builder</span></div>
          <div className={styles.missionTag}><Sparkles size={16} /> MISSION 003 · LEVEL 1</div>
          <h1>Can you build your first app in <span>90 seconds?</span></h1>
          <p>Design your screen, connect navigation, add button logic, and test a simulated Study Planner.</p>
          <div className={styles.facts}><span><Check size={17} /> Free to play</span><span><Check size={17} /> No registration</span><span><ShieldCheck size={17} /> Beginner-friendly</span></div>
          <div className={styles.heroActions}><Link href="/app-builder/level-1?mode=challenge" className={styles.primary}><Clock3 size={19} /> Start 90s Challenge <ArrowRight size={18} /></Link><Link href="/app-builder/level-1?mode=practice" className={styles.secondary}><Play size={19} /> Practice without timer</Link></div>
          <p className={styles.disclaimer}>Build a controlled browser simulation — not a downloadable or production mobile app.</p>
        </div>
        <div className={styles.studioVisual} aria-label="Study Planner app-builder illustration">
          <div className={styles.visualGlow} aria-hidden="true" />
          <Image
            src="/images/play/app-builder/app-builder-card-3d-v1.png"
            alt="3D App Builder workspace connecting Header, Navigation and Mark Done components to a Study Planner phone"
            width={1200}
            height={800}
            priority
            sizes="(max-width: 950px) 100vw, 52vw"
            className={styles.studioImage}
          />
        </div>
      </section>

      <section className={styles.how}>
        <div className={styles.sectionHeading}><span>HOW TO PLAY</span><h2>Build it like a developer.</h2><p>Every stage changes the live phone preview. Your choices create real navigation, logic, and state inside the simulation.</p></div>
        <div className={styles.stages}>{stageCards.map(({ number, title, copy, icon: Icon }) => <article key={number}><div><span>{number}</span><Icon size={22} /></div><h3>{title}</h3><p>{copy}</p><small>Up to 25 points</small></article>)}</div>
      </section>

      <section className={styles.modes}>
        <article><div className={styles.modeIcon}><Clock3 size={25} /></div><small>FAST-PACED</small><h2>90-second Challenge</h2><p>The same complete mission under one accurate countdown. Earn points for correct stage validations before time expires.</p><Link href="/app-builder/level-1?mode=challenge">Start Challenge <ArrowRight size={17} /></Link></article>
        <article><div className={styles.modeIcon}><BookOpen size={25} /></div><small>LEARN AT YOUR PACE</small><h2>Untimed Practice</h2><p>Explore every builder control without time pressure. The stages, feedback, tests, and score rules stay the same.</p><Link href="/app-builder/level-1?mode=practice">Start Practice <ArrowRight size={17} /></Link></article>
      </section>

      <section className={styles.levels}>
        <div className={styles.sectionHeading}><span>APP BUILDER PATH</span><h2>Level 1 is ready.</h2></div>
        <div className={styles.levelGrid}><article className={styles.levelLive}><span>LEVEL 1</span><h3>Build Your First App</h3><p>Design, connect, program, test, and debug a Study Planner.</p><Link href="/app-builder/level-1?mode=challenge">Play now <ArrowRight size={16} /></Link></article><article><LockKeyhole size={22} /><span>LEVEL 2</span><h3>Coming Soon</h3><p>Locked — no playable route is published.</p></article><article><LockKeyhole size={22} /><span>LEVEL 3</span><h3>Coming Soon</h3><p>Locked — continue learning with Level 1 today.</p></article></div>
      </section>

      <section className={styles.course}><div><span>CONTINUE YOUR LEARNING</span><h2>Turn the simulation into practical mobile app skills.</h2><p>Explore the official Mobile App Development Kickstart course on the Techromz Institute website. Playing does not enrol you.</p></div><a href={courseUrl} target="_blank" rel="noopener noreferrer" onClick={() => trackAppBuilderEvent({ name: 'app_builder_course_click' })}>Explore Mobile Kickstart <ArrowRight size={18} /></a></section>
    </main>
  );
}
