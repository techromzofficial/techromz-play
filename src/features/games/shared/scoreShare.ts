export type CelebrationTier = 'normal' | 'achievement' | 'strong' | 'perfect';

export type ScoreCardData = {
  game: string;
  score: number;
  mode: string;
  achievement: string;
  artwork: string;
  publicUrl: string;
  brandLogo?: string;
  levelLabel?: string;
};

export function celebrationTier(score: number, completed = true): CelebrationTier {
  if (!completed || score < 75) return 'normal';
  if (score === 100) return 'perfect';
  if (score >= 90) return 'strong';
  return 'achievement';
}

export function facebookShareUrl(publicUrl: string) {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
}

export function whatsappShareUrl(message: string, publicUrl: string) {
  return `https://wa.me/?text=${encodeURIComponent(`${message}\n${publicUrl}`)}`;
}

export async function copyPublicUrl(publicUrl: string) {
  if (!navigator.clipboard?.writeText) return false;
  try { await navigator.clipboard.writeText(publicUrl); return true; } catch { return false; }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function generateScoreCard(data: ScoreCardData): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 1200;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Score image generation is unavailable.');
  const gradient = ctx.createLinearGradient(0, 0, 1200, 1200);
  gradient.addColorStop(0, '#0B1530'); gradient.addColorStop(.58, '#1246AB'); gradient.addColorStop(1, '#2563EB');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 1200, 1200);
  try {
    const art = await loadImage(data.artwork);
    if (data.brandLogo) {
      const scale = Math.min(520 / art.width, 535 / art.height);
      const width = art.width * scale; const height = art.height * scale;
      ctx.save(); ctx.globalAlpha = .96; ctx.shadowColor = '#2563EB'; ctx.shadowBlur = 35; ctx.drawImage(art, 1200 - width - 35, 75, width, height); ctx.restore();
    } else {
      const scale = Math.max(1200 / art.width, 570 / art.height);
      const width = art.width * scale; const height = art.height * scale;
      ctx.save(); ctx.globalAlpha = .78; ctx.drawImage(art, (1200 - width) / 2, (570 - height) / 2, width, height); ctx.restore();
    }
  } catch { /* The branded card remains usable if an image cannot load. */ }
  const shade = ctx.createLinearGradient(0, 280, 0, 760); shade.addColorStop(0, '#0B153000'); shade.addColorStop(1, '#0B1530'); ctx.fillStyle = shade; ctx.fillRect(0, 260, 1200, 520);
  if (data.brandLogo) {
    try { const logo = await loadImage(data.brandLogo); const width = 360; const height = width * logo.height / logo.width; ctx.drawImage(logo, 70, 55, width, height); } catch { /* Retain the text fallback below. */ }
    ctx.fillStyle = '#8EB3FF'; ctx.font = '800 24px Arial'; ctx.letterSpacing = '4px'; ctx.fillText('TECHROMZ PLAY', 72, 235);
    ctx.fillStyle = '#FFFFFF'; ctx.font = '900 31px Arial'; ctx.letterSpacing = '1px'; ctx.fillText(data.levelLabel ?? data.game, 72, 288);
    if (data.score === 100) {
      ctx.fillStyle = '#F6C65B'; ctx.fillRect(70, 325, 470, 58); ctx.fillStyle = '#0B1530'; ctx.font = '900 25px Arial'; ctx.letterSpacing = '2px'; ctx.fillText('PERFECT SCORE · 100/100', 92, 363);
      for (let i = 0; i < 20; i++) { ctx.fillStyle = ['#FFFFFF','#8EB3FF','#F6C65B'][i%3]; ctx.beginPath(); ctx.arc(45 + (i*67)%1110, 28 + (i*83)%500, 3 + i%4, 0, Math.PI*2); ctx.fill(); }
    }
  } else { ctx.fillStyle = '#EAF1FF'; ctx.font = '800 28px Arial'; ctx.letterSpacing = '5px'; ctx.fillText('TECHROMZ PLAY', 70, 80); }
  ctx.fillStyle = '#8EB3FF'; ctx.font = '800 25px Arial'; ctx.fillText(data.mode.toUpperCase(), 70, 660);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '900 68px Arial'; ctx.fillText(data.game, 70, 735);
  ctx.font = '900 238px Arial'; ctx.fillText(String(data.score), 58, 990);
  ctx.fillStyle = '#C9D9FF'; ctx.font = '800 54px Arial'; ctx.fillText('/100', 430, 982);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '900 38px Arial'; ctx.fillText(data.achievement, 70, 1060);
  ctx.fillStyle = '#C9D9FF'; ctx.font = '600 25px Arial'; ctx.fillText('Think. Play. Innovate.  •  play.techromzit.com', 70, 1125);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to create score image.')), 'image/png'));
}
