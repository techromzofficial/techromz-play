import Image from 'next/image';
import styles from './LobbyRobot.module.css';

export default function LobbyRobot() {
  return (
    <div className={styles.scene} aria-label="AI companion powering on for the mission">
      <div className={styles.grid} aria-hidden="true" />
      <span className={styles.aura} aria-hidden="true" />
      <div className={styles.character}>
        <Image
          src="/images/institute/play/ai-master-robot-3d-v3.png"
          alt="Friendly white and blue 3D AI robot companion"
          fill
          priority
          sizes="(max-width: 767px) 90vw, 430px"
          className={styles.robot}
        />
        {/* Robotic glowing eyebrows matching character design */}
        <span className={`${styles.brow} ${styles.browLeft}`} aria-hidden="true" />
        <span className={`${styles.brow} ${styles.browRight}`} aria-hidden="true" />

        {/* Expressive glowing 3D AI eyes with natural digital blinking */}
        <span className={`${styles.eyeSocket} ${styles.eyeLeft}`} aria-hidden="true">
          <span className={styles.eyeOpen} />
          <span className={styles.eyeClosed} />
        </span>
        <span className={`${styles.eyeSocket} ${styles.eyeRight}`} aria-hidden="true">
          <span className={styles.eyeOpen} />
          <span className={styles.eyeClosed} />
        </span>
        <span className={styles.coreGlow} aria-hidden="true" />
      </div>
      <div className={styles.platform} aria-hidden="true"><span /><i /></div>
      <div className={styles.status}>
        <span><i aria-hidden="true" /> AI COMPANION ONLINE</span>
        <span className={styles.signal} aria-hidden="true"><i /><i /><i /></span>
      </div>
    </div>
  );
}
