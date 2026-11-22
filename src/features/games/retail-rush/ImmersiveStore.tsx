'use client';

import { useEffect, useRef, useState } from 'react';
import { PRODUCT_IDS, PRODUCTS } from './scenarios';
import type { StoreVisualState } from './visual-state';
import { ProductArt } from './StoreScene';
import styles from './ImmersiveStore.module.css';

type Props = StoreVisualState & { onSelect?: (id: typeof PRODUCT_IDS[number]) => void; onCheckout?: () => void };

/** Lazy-load the renderer only in a browser. All gameplay controls remain ordinary HTML. */
export default function ImmersiveStore(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const snapshot = useRef(props);
  snapshot.current = props;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    setReady(false); setFailed(false);
    if (!host.current || typeof window.WebGLRenderingContext === 'undefined') { setFailed(true); return; }
    const element = host.current;
    import('./supermarket-renderer').then(({ createSupermarket }) => {
      if (disposed) return;
      try {
        cleanup = createSupermarket(element, () => snapshot.current, {
          select: (id) => snapshot.current.onSelect?.(id),
          checkout: () => snapshot.current.onCheckout?.(),
        }, quality, () => { setFailed(true); setReady(false); });
        setReady(true);
      } catch { setFailed(true); }
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; cleanup?.(); };
  }, [quality]);
  return <div className={styles.store}>
    <div className={styles.viewport} ref={host} aria-hidden="true" />
    {(!ready || failed) && <div className={styles.fallback}><div className={styles.fallbackSign}>RUSH MART<small>YOUR NEIGHBOURHOOD STORE</small></div><div className={styles.fallbackShelves}>{PRODUCT_IDS.map(id => <div key={id}><strong>{PRODUCTS[id].name}</strong><span>{props.inventory[id]} in stock</span><small>LKR {PRODUCTS[id].standardPrice} / ea</small></div>)}</div><p>{failed ? 'Simple visual mode · All game controls are available below.' : 'Opening your supermarket…'}</p></div>}
    <div className={styles.caption}><span><i /> STORE OPEN</span><span>FLOOR 01 · RUSH MART</span></div>
    {ready && !failed && <button className={styles.quality} onClick={() => setQuality(quality === 'high' ? 'low' : 'high')} aria-label={`Visual quality: ${quality}. Switch quality`}>{quality === 'high' ? 'High detail' : 'Eco detail'}</button>}
    <div className={styles.shelfControls} aria-label="Supermarket shelves">{PRODUCT_IDS.map(id => <button key={id} onClick={() => props.onSelect?.(id)} aria-pressed={props.selected === id} aria-label={`Select ${PRODUCTS[id].name} shelf, ${props.inventory[id]} in stock${props.delivery?.productId === id ? ', 2 incoming' : ''}`}><span>{props.requested === id ? 'ORDER' : `AISLE ${PRODUCT_IDS.indexOf(id) + 1}`}</span><span className={styles.shelfProduct}><ProductArt id={id} /><strong>{PRODUCTS[id].name}</strong></span><small>LKR {PRODUCTS[id].standardPrice} / ea</small><em data-low={props.inventory[id] < 2}>{props.inventory[id]} left{props.delivery?.productId === id ? ' · +2 incoming' : props.inventory[id] < 2 ? ' · Low stock' : ''}</em></button>)}</div>
    {props.onCheckout && <button className={styles.checkout} onClick={() => props.onCheckout?.()}>POS / CHECKOUT <span>Choose a price in the checkout panel</span></button>}
  </div>;
}

