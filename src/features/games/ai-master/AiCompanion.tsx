import Image from 'next/image';
import { Code2, GraduationCap, PartyPopper, RotateCcw, ShoppingBag } from 'lucide-react';
import styles from './AiCompanion.module.css';
import type { Level1Role } from './levels/level1';

type Props = {
  level: 0 | 1 | 2 | 3;
  compact?: boolean;
  responsive?: boolean;
  role?: Level1Role | null;
  mood?: 'celebrate' | 'encourage';
};
const labels = ['SYSTEM STANDBY', 'CORE ONLINE', 'INSTRUCTIONS LOADED', 'SYSTEM TESTED'];
const roleLabels: Record<Level1Role, string> = {
  tutor: 'STUDY COACH ONLINE',
  sales: 'SALES ASSISTANT ONLINE',
  coder: 'CODING ASSISTANT ONLINE',
};

const roleBadges: Record<Level1Role, string> = {
  tutor: 'TUTOR MODE',
  sales: 'SALES MODE',
  coder: 'CODER MODE',
};

function RoleIcon({ role, size = 16 }: { role: Level1Role; size?: number }) {
  if (role === 'tutor') return <GraduationCap size={size} aria-hidden="true" />;
  if (role === 'sales') return <ShoppingBag size={size} aria-hidden="true" />;
  return <Code2 size={size} aria-hidden="true" />;
}

export default function AiCompanion({ level, compact = false, responsive = false, role = null, mood }: Props) {
  const statusLabel = mood === 'celebrate'
    ? 'MISSION ACCOMPLISHED'
    : mood === 'encourage'
      ? 'READY TO TRY AGAIN'
      : role
        ? roleLabels[role]
        : labels[level];

  const chamberClasses = [
    styles.chamber,
    responsive ? styles.responsive : compact ? styles.compact : '',
    level > 0 ? styles.online : '',
    role ? styles[`role_${role}`] : '',
    mood ? styles[mood] : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={chamberClasses}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.portrait}>
        <Image
          src="/images/institute/play/ai-master-hero.webp"
          alt="Techromz Play AI robot companion"
          fill
          sizes={compact ? '96px' : '(max-width: 640px) 90vw, 430px'}
          className={styles.robot}
          priority={!compact}
        />
        <span className={styles.scan} aria-hidden="true" />

        {/* Visor Expression HUD shift */}
        {role && (
          <span key={`hud-${role}`} className={`${styles.visorHud} ${styles[`hud_${role}`]}`} aria-hidden="true">
            <i className={styles.hudBeacon} />
            <span className={styles.hudIcon}><RoleIcon role={role} size={12} /></span>
            <span>{roleBadges[role]}</span>
          </span>
        )}

        {/* Dynamic Tool Icon & Status Badge */}
        {role && (
          <span key={`tool-${role}`} className={styles.roleTool} role="status">
            <span className={styles.toolIconWrap}><RoleIcon role={role} size={15} /></span>
            <span className={styles.roleLabelText}>{roleLabels[role]}</span>
          </span>
        )}

        {mood && (
          <span className={styles.moodIcon} aria-hidden="true">
            {mood === 'celebrate' ? <PartyPopper size={20} /> : <RotateCcw size={20} />}
          </span>
        )}
      </div>
      <div className={styles.status}>
        <span>{statusLabel}</span>
        <span className={styles.lights} aria-hidden="true">
          {[1, 2, 3].map(n => (
            <i key={n} className={n <= level ? styles.lit : ''} />
          ))}
        </span>
      </div>
    </div>
  );
}
