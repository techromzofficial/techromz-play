'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { nameLength, playerNameError } from './PlayerNameSession';
import styles from './PlayerNameModal.module.css';

export default function PlayerNameModal({ initialName = '', onConfirm, onClose }: { initialName?: string; onConfirm: (name: string) => void; onClose: () => void }) {
  const [value, setValue] = useState(initialName);
  const [submitted, setSubmitted] = useState(false);
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const error = playerNameError(value);
  const showError = submitted || nameLength(value.trim()) > 30;
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const modal = dialog.current;
    const overflow = document.body.style.overflow;
    modal?.showModal();
    document.body.style.overflow = 'hidden';
    input.current?.focus();
    return () => {
      modal?.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={dialog} className={styles.modal} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} aria-modal="true"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => {
      const box = event.currentTarget.getBoundingClientRect();
      if (event.target === event.currentTarget && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) onClose();
    }}
    onKeyDown={(event) => {
      if (event.key !== 'Tab') return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>('input, button');
      if (!controls?.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}>
    <h2 id={`${id}-title`}>Welcome to Retail Rush!</h2>
    <p id={`${id}-description`}>Enter your name to start your retail store challenge.</p>
    <form noValidate onSubmit={(event) => { event.preventDefault(); setSubmitted(true); if (error) { input.current?.focus(); return; } onConfirm(value.trim()); }}>
      <label htmlFor={`${id}-name`}>Player Name</label>
      <input ref={input} id={`${id}-name`} name="playerName" type="text" autoComplete="off" required placeholder="Enter your name" value={value}
        onChange={(event) => setValue(event.target.value)} aria-invalid={showError && Boolean(error)} aria-describedby={`${id}-limit${showError && error ? ` ${id}-error` : ''}`} />
      <span id={`${id}-limit`} className={styles.hint}>Up to 30 characters · Kept only for this browser session.</span>
      {showError && error && <p id={`${id}-error`} className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}><button type="submit" className={styles.primary}>Start Game</button><button type="button" onClick={onClose}>Cancel</button></div>
    </form>
  </dialog>;
}
