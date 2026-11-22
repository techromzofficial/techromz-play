'use client';

import { useEffect, useState } from 'react';
import { Copy, Download, Facebook, Image as ImageIcon, Share2, X } from 'lucide-react';
import Image from 'next/image';
import { celebrationTier, copyPublicUrl, facebookShareUrl, generateScoreCard, whatsappShareUrl, type ScoreCardData } from './scoreShare';
import styles from './ScoreSharePanel.module.css';

type Props = ScoreCardData & { completed?: boolean; challengeMessage: string };

export default function ScoreSharePanel(props: Props) {
  const [preview, setPreview] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState('');
  const tier = celebrationTier(props.score, props.completed !== false);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  async function createPreview() {
    try {
      const next = await generateScoreCard(props); const url = URL.createObjectURL(next);
      if (preview) URL.revokeObjectURL(preview); setBlob(next); setPreview(url); setStatus('Score image ready to preview, download or share.');
    } catch { setStatus('Score image could not be generated on this device.'); }
  }
  function download() {
    if (!preview) return; const link = document.createElement('a'); link.href = preview; link.download = `techromz-play-${props.game.toLowerCase().replace(/\W+/g, '-')}-${props.score}.png`; link.click(); setStatus('Score image download started.');
  }
  async function nativeShare() {
    if (!blob) return; const file = new File([blob], 'techromz-play-score.png', { type: 'image/png' });
    if (!navigator.share || (navigator.canShare && !navigator.canShare({ files: [file] }))) { download(); setStatus('File sharing is unavailable, so the score image was downloaded instead.'); return; }
    try { await navigator.share({ title: `${props.game} score`, text: props.challengeMessage, url: props.publicUrl, files: [file] }); setStatus('Share interface closed. Your device will confirm whether it was sent.'); } catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) { download(); setStatus('File sharing failed, so the score image was downloaded instead.'); } }
  }
  async function copy() { const copied = await copyPublicUrl(props.publicUrl); setStatus(copied ? 'Challenge link copied.' : 'Copy failed. Please copy the address from your browser.'); }
  return <><section className={`${styles.panel} ${styles[`tier${tier[0].toUpperCase()}${tier.slice(1)}`] ?? ''}`} aria-label="Share your result">
    <p>SHARE YOUR RESULT</p><h2>Challenge another player</h2><p>Your personalised image is separate from the public link preview used by Facebook and WhatsApp.</p>
    <div className={styles.actions}><button className={styles.primary} onClick={createPreview}><ImageIcon size={18}/> Share Your Score</button><a href={facebookShareUrl(props.publicUrl)} target="_blank" rel="noopener noreferrer" onClick={() => setStatus('Facebook sharing opened. Complete the post on Facebook.')}><Facebook size={18}/> Share on Facebook</a><a href={whatsappShareUrl(props.challengeMessage, props.publicUrl)} target="_blank" rel="noopener noreferrer" onClick={() => setStatus('WhatsApp sharing opened. Complete the message in WhatsApp.')}><Share2 size={18}/> Share on WhatsApp</a><button onClick={copy}><Copy size={18}/> Copy Challenge Link</button></div>
    <p className={styles.status} role="status">{status}</p>
    {preview && <div className={styles.modal} role="presentation"><div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Score image preview"><div className={styles.dialogHeader}><h2>Score image preview</h2><button onClick={() => setPreview('')} aria-label="Close score image preview"><X/></button></div><Image unoptimized width={1200} height={1200} className={styles.preview} src={preview} alt={`${props.game} score card showing ${props.score} out of 100`} /><div className={styles.modalActions}><button className={styles.primary} onClick={nativeShare}><Share2 size={18}/> Share image</button><button onClick={download}><Download size={18}/> Download image</button></div></div></div>}
  </section>{tier !== 'normal' && <div className={styles.confetti} aria-hidden="true">{Array.from({ length: tier === 'perfect' ? 42 : tier === 'strong' ? 32 : 22 }, (_, i) => <i key={i} style={{ '--i': i, '--c': ['#fff', '#8eb3ff', '#2563eb', '#f6c65b'][i % 4] } as React.CSSProperties} />)}</div>}</>;
}
