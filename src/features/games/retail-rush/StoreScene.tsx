import type { Delivery, CustomerStatus } from './game-engine';
import { PRODUCT_IDS, PRODUCTS, type ProductId } from './scenarios';
import styles from './RetailRushGame.module.css';

export function ProductArt({ id }: { id: ProductId }) {
  return <svg viewBox="0 0 48 64" aria-hidden="true" className={styles.productArt}>
    {id === 'water' ? <><path d="M18 9h12v8l5 8v32q-11 6-22 0V25l5-8Z" fill="#b8e6ff" stroke="#1246ab" strokeWidth="2" /><rect x="18" y="4" width="12" height="7" rx="2" fill="#2563eb" /><path d="M15 32h18v16H15Z" fill="#2563eb" /><path d="M24 35q-10 12 0 10q10 2 0-10" fill="white" /><path d="M18 23v7m0 21v4" stroke="white" strokeWidth="3" /></> : id === 'milk' ? <><path d="M13 18 19 5h14l4 13v42H11V18Z" fill="#fff" stroke="#1246ab" strokeWidth="2" /><path d="m13 18 6-13 6 13v42H11V18Z" fill="#dce8ff" /><path d="M12 30h24v19H12Z" fill="#1246ab" /><path d="m24 32-6 8h12Z" fill="white" /><path d="M19 5h14" stroke="#2563eb" strokeWidth="4" /></> : <><path d="m10 6 28 1-3 12 3 40-28 1 3-41Z" fill="#f2c477" stroke="#9b6424" strokeWidth="2" /><path d="M12 25h24v20H12Z" fill="#0b1530" /><ellipse cx="24" cy="35" rx="8" ry="5" fill="#f2c477" /><path d="M11 10h26M11 55h26" stroke="#fff" strokeWidth="2" /></>}
  </svg>;
}

type Props = {
  inventory: Record<ProductId, number>;
  requested?: ProductId;
  selected?: ProductId;
  customerId?: number;
  statuses?: CustomerStatus[];
  delivery?: Delivery | null;
  now?: number;
  onSelect?: (id: ProductId) => void;
  onCheckout?: () => void;
};

/** Presentation only. No timers, transactions or inventory mutations. */
export default function StoreScene({ inventory, requested, selected, customerId, statuses, delivery, now = 0, onSelect, onCheckout }: Props) {
  const lastCustomer = statuses?.map((status, index) => ({ status, index })).filter(({ status }) => status === 'served' || status === 'expired').pop();
  const progress = delivery ? Math.max(0, Math.min(100, 100 * (now - delivery.orderedAt) / (delivery.completesAt - delivery.orderedAt))) : 0;
  return <div className={styles.scene} aria-label="Miniature supermarket">
    <svg viewBox="0 0 900 540" className={styles.room} aria-hidden="true">
      <defs><linearGradient id="rr-floor" x2="1" y2="1"><stop stopColor="#eaf1ff" /><stop offset="1" stopColor="#a9bedc" /></linearGradient><linearGradient id="rr-wall"><stop stopColor="#193466" /><stop offset="1" stopColor="#355e99" /></linearGradient><pattern id="rr-tiles" width="70" height="42" patternUnits="userSpaceOnUse" patternTransform="skewX(-28)"><path d="M70 0H0v42" fill="none" stroke="#8ea7ca" strokeWidth="1" /></pattern></defs>
      <ellipse cx="454" cy="469" rx="385" ry="46" fill="#000" opacity=".24" />
      <path d="M55 170 675 90 858 260 250 514 55 340Z" fill="url(#rr-floor)" />
      <path d="M55 170 675 90 858 260 250 514 55 340Z" fill="url(#rr-tiles)" opacity=".7" />
      <path d="M55 170V63L675 12v78Z" fill="url(#rr-wall)" /><path d="M675 12 858 175v85L675 90Z" fill="#152b51" />
      <path d="M55 165 675 85 858 254v12L675 97 55 179Z" fill="#2563eb" />
      <path d="M55 340 250 514 858 260v15L250 531 55 355Z" fill="#6885ad" />
      <rect x="85" y="86" width="160" height="36" rx="6" fill="#eaf1ff" opacity=".95" />
      <path d="M745 130v91l48 41v-91Z" fill="#8dcce7" opacity=".75" stroke="#eaf1ff" strokeWidth="4" /><path d="m771 152 0 85" stroke="#eaf1ff" strokeWidth="3" />
      <path d="m512 335 135-48 120 71-137 56Z" fill="#fff" /><path d="m512 335 118 79v72l-118-86Z" fill="#183b74" /><path d="m630 414 137-56v72l-137 56Z" fill="#1246ab" /><path d="m498 331 146-55 137 79-150 63Z" fill="#c6d7ed" stroke="#fff" strokeWidth="3" />
      <path d="M650 309v40l-41-17v-40Z" fill="#0b1530" stroke="#5676a7" strokeWidth="5" /><path d="m614 301 31 13v23l-31-13Z" fill="#66e0bf" /><path d="m630 339-5 16 27 10" fill="none" stroke="#0b1530" strokeWidth="7" />
      <path d="m696 357 25-9 15 9-25 10Z" fill="#0b1530" /><path d="m698 357 14 6" stroke="#8eb3ff" strokeWidth="3" />
      <path d="m90 329 99-26 73 53-107 35Z" fill="#8ea7ca" stroke="#fff" strokeDasharray="6 5" strokeWidth="2" />
      <path d="M94 54 651 9" stroke="#8eb3ff" strokeWidth="4" />
    </svg>
    <span className={styles.storeSign}>RUSH MART <small>YOUR NEIGHBOURHOOD STORE</small></span>
    <span className={styles.entrance}>ENTRANCE</span>
    <div className={styles.shelves}>
      {PRODUCT_IDS.map((id) => {
        const content = <><span className={styles.shelfTitle}>{PRODUCTS[id].name}</span><span className={styles.packages} aria-hidden="true">{Array.from({ length: Math.min(6, inventory[id]) }, (_, i) => <ProductArt key={`${id}-${inventory[id]}-${i}`} id={id} />)}</span><span className={styles.shelfCount}>{inventory[id]} left{delivery?.productId === id ? ' · +2 incoming' : inventory[id] < 2 ? ' · Low stock' : ''}</span>{requested === id && <span className={styles.requestFlag}>ORDER</span>}</>;
        return onSelect ? <button key={id} type="button" className={`${styles.shelf} ${requested === id ? styles.requestedShelf : ''}`} aria-pressed={selected === id} aria-label={`Select ${PRODUCTS[id].name} shelf, ${inventory[id]} in stock${delivery?.productId === id ? ', 2 incoming' : ''}`} onClick={() => onSelect(id)}>{content}</button> : <div key={id} className={styles.shelf}>{content}</div>;
      })}
    </div>
    <div className={styles.deliveryZone}><span>DELIVERY BAY</span>{delivery ? <div className={styles.deliveryBox} style={{ transform: `translateX(${progress * .25}px)` }}>+2</div> : <span className={styles.emptyBay}>□</span>}</div>
    {customerId && <div key={customerId} className={styles.customer} aria-hidden="true"><span className={styles.customerHead} /><span className={styles.customerBody} /><span className={styles.customerLegs} /><span className={styles.basket}>▤</span><span className={styles.customerNumber}>{customerId}</span></div>}
    {lastCustomer && <div key={`${lastCustomer.index}-${lastCustomer.status}`} className={styles.departure} aria-hidden="true">{lastCustomer.status === 'served' ? '✓ Thank you!' : 'Time to go'}<span>●</span></div>}
    {onCheckout ? <button className={styles.posHotspot} type="button" onClick={onCheckout}>POS / CHECKOUT <span>Choose a price below</span></button> : <span className={styles.posHotspot}>POS / CHECKOUT</span>}
  </div>;
}
