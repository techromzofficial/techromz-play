'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock3, PackagePlus, ShoppingBasket, Truck } from 'lucide-react';
import { activeCustomerIndex, createInitialState, customerSecondsRemaining, customersServed, gameReducer, netProfit, secondsRemaining } from './game-engine';
import { CUSTOMERS, PRODUCT_IDS, PRODUCTS, RESTOCK_UNITS, type ProductId } from './scenarios';
import { ProductArt } from './StoreScene';
import ImmersiveStore from './ImmersiveStore';
import RushResults from './RushResults';
import { validateChallenge } from './share';
import PlayerNameModal from './PlayerNameModal';
import { getPlayerName, playerNameError, rememberPlayerName } from './PlayerNameSession';
import styles from './RetailRushGame.module.css';

const money = (value: number) => `LKR ${value.toLocaleString('en-LK')}`;
const tutorial = [
  ['Read the order', 'Every customer wants a full order. Check the quantity, budget and patience before using the POS.'],
  ['Choose the right price', 'Standard prices protect your margin. If the total exceeds the budget, try the offer. Rejected orders do not charge the customer.'],
  ['Keep the shelves ready', 'Select a shelf and order two units. Standard delivery takes 4 seconds; express takes 1 second and adds LKR 30. Buy ahead of the next arrival.'],
];

export default function RetailRushGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const [selected, setSelected] = useState<ProductId>('water');
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [challenge, setChallenge] = useState<'default' | 'valid' | 'invalid'>('default');
  const [playerName, setPlayerName] = useState('');
  const [nameOpen, setNameOpen] = useState(false);
  const heading = useRef<HTMLDivElement>(null);
  const checkout = useRef<HTMLElement>(null);

  useEffect(() => {
    const name = getPlayerName();
    setPlayerName(name);
    if (!name) setNameOpen(true);
  }, []);
  useEffect(() => { setChallenge(validateChallenge(window.location.search)); }, []);
  useEffect(() => { if (state.phase !== 'intro') heading.current?.querySelector<HTMLElement>('h1')?.focus(); }, [state.phase]);
  useEffect(() => {
    if (state.phase !== 'playing') return;
    const sync = () => dispatch({ type: 'tick', now: Date.now() });
    const interval = window.setInterval(sync, 100);
    document.addEventListener('visibilitychange', sync);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', sync); };
  }, [state.phase]);
  useEffect(() => {
    if (state.phase !== 'playing' || state.mode !== 'timed') return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [state.phase, state.mode]);

  const activeIndex = activeCustomerIndex(state);
  const customer = activeIndex >= 0 ? CUSTOMERS[activeIndex] : null;
  const product = customer ? PRODUCTS[customer.productId] : null;
  const gameSeconds = secondsRemaining(state);
  const patienceSeconds = customerSecondsRemaining(state);
  const served = customersServed(state);
  const nextCustomer = CUSTOMERS.find((_, index) => state.customerStatuses[index] === 'pending');
  const nextSeconds = nextCustomer && state.startedAt !== null ? Math.max(0, Math.ceil((state.startedAt + nextCustomer.arrivalSeconds * 1000 - state.now) / 1000)) : null;
  const deliveryProgress = state.delivery ? Math.max(0, Math.min(100, 100 * (state.now - state.delivery.orderedAt) / (state.delivery.completesAt - state.delivery.orderedAt))) : 0;
  const selectedProduct = PRODUCTS[selected];

  function start(mode: 'timed' | 'practice') {
    if (playerNameError(playerName)) { setNameOpen(true); return; }
    setTutorialStep(null); setSelected('water'); dispatch({ type: 'start', mode, now: Date.now() });
  }
  function replay() { setSelected('water'); setTutorialStep(null); dispatch({ type: 'restart' }); }

  return <main className={styles.game}>
    <div className={styles.gameShell} ref={heading}>
      <header className={styles.gameHeader}><div><Link className={styles.backLink} href="/" onClick={(event) => { if (state.phase === 'playing' && !window.confirm('Leave this active shift? Your current attempt will not be saved.')) event.preventDefault(); }}>← Back to All Games</Link><p className={styles.eyebrow}>MISSION 002 / RETAIL RUSH</p></div><span className={styles.simulationLabel}>FICTIONAL STORE · REAL DECISIONS</span></header>
      {state.phase === 'intro' ? <section className={styles.intro}>
        <div className={styles.introCopy}><p className={styles.eyebrow}>YOUR STORE. YOUR DECISIONS. YOUR SUCCESS.</p><h1>Manage your store in 60 seconds.</h1><p className={styles.introLead}>A small shop.<br />Six customers. Big decisions.</p><p className={styles.muted}>Read the order, choose a price and keep your shelves ready. All money and transactions are fictional simulation values.</p>
          <div className={styles.introFacts}><span><strong>LKR 2,000</strong>Starting cash</span><span><strong>6 customers</strong>One shift</span><span><strong>100 points</strong>Your target</span></div>
          {challenge !== 'default' && <p role="status" className={styles.challengeNotice}>{challenge === 'valid' ? 'Friend challenge · Retail 001 / v1. Everyone plays the same scenario.' : 'Unsupported challenge link. The original Retail 001 / v1 scenario will be used safely.'}</p>}
          <div className={styles.actionGrid}><button className={styles.primaryButton} onClick={() => start('timed')}><Clock3 size={19} /> Start 60-second challenge</button><button className={styles.secondaryButton} onClick={() => start('practice')}><ShoppingBasket size={19} /> Practise without a timer</button></div>
          <button className={styles.tutorialButton} onClick={() => setTutorialStep(tutorialStep === null ? 0 : null)} aria-expanded={tutorialStep !== null}>How to play · guided tutorial</button>
          {tutorialStep !== null && <section className={styles.tutorial} aria-label="Guided tutorial"><p className={styles.eyebrow}>STEP {tutorialStep + 1} OF 3 · NO TIMER RUNNING</p><h2>{tutorial[tutorialStep][0]}</h2><p>{tutorial[tutorialStep][1]}</p><div className={styles.actionGrid}>{tutorialStep > 0 && <button className={styles.secondaryButton} onClick={() => setTutorialStep(tutorialStep - 1)}>Previous</button>}<button className={styles.primaryButton} onClick={() => tutorialStep < 2 ? setTutorialStep(tutorialStep + 1) : setTutorialStep(null)}>{tutorialStep < 2 ? 'Next tip' : 'Ready to play'}</button></div></section>}
        </div>
        <div className={styles.introVisual}><span className={styles.sceneCaption}>WELCOME TO YOUR NEXT SHIFT</span><div className={styles.introImageFrame}><Image src="/images/institute/play/retail-rush-diorama.png" alt="Premium Rush Mart store with product aisles, a customer and the checkout counter" width={1450} height={1086} sizes="(max-width: 1000px) 100vw, 55vw" priority className={styles.introImage} /></div><p className={styles.muted}>Serve wisely. Restock early. Make every sale count.</p><div className={styles.introHint}><span>01 / READ</span><span>02 / PRICE</span><span>03 / RESTOCK</span></div></div>
      </section> : state.phase === 'results' ? <RushResults state={state} playerName={playerName} onReplay={replay} /> : <>
        <div className={styles.shiftHeader}><div><p className={styles.eyebrow}>{state.mode === 'timed' ? 'THE STORE IS OPEN' : 'LEARN AT YOUR OWN PACE'}</p><h1 tabIndex={-1}>Retail Rush <span className={styles.playerTag}>{playerName}&apos;s store</span></h1></div><div className={`${styles.timer} ${gameSeconds !== null && gameSeconds <= 10 ? styles.urgent : ''}`} aria-label={gameSeconds === null ? 'Untimed practice' : `${gameSeconds} seconds remaining`}><Clock3 size={20} />{gameSeconds === null ? 'PRACTICE' : `${String(Math.floor(gameSeconds / 60)).padStart(2, '0')}:${String(gameSeconds % 60).padStart(2, '0')}`}</div></div>
        <section className={styles.hud} aria-label="Store finances"><Metric label="Cash" value={money(state.cash)} /><Metric label="Revenue" value={money(state.revenue)} /><Metric label="Profit" value={money(netProfit(state))} /><Metric label="Served" value={`${served}/6`} /></section>
        <div className={styles.playLayout}>
          <div className={styles.storeColumn}><section id="rush-store" className={styles.storePanel} aria-label="Interactive store"><div className={styles.sceneToolbar}><span>RUSH MART / FLOOR 01</span><span>Tap a shelf to restock</span></div><nav className={styles.sceneNav} aria-label="Store sections"><a href="#rush-store"><ShoppingBasket size={20} />Store</a><a href="#rush-inventory"><PackagePlus size={20} />Inventory</a><a href="#rush-checkout"><Truck size={20} />Checkout</a></nav><ImmersiveStore revenue={state.revenue} message={state.message} inventory={state.inventory} requested={customer?.productId} selected={selected} customerId={customer?.id} statuses={state.customerStatuses} delivery={state.delivery} now={state.now} onSelect={setSelected} onCheckout={() => { checkout.current?.scrollIntoView({ block: 'nearest', behavior: 'auto' }); checkout.current?.querySelector<HTMLButtonElement>('button')?.focus(); }} /></section>
            <section id="rush-inventory" className={styles.inventoryPanel} aria-label="Inventory and delivery"><div className={styles.sectionTitle}><div><p className={styles.eyebrow}>KEEP THE SHELVES READY</p><h2>Restock your store</h2></div><Truck size={24} aria-hidden="true" /></div>
              <div className={styles.productTabs} aria-label="Choose a product">{PRODUCT_IDS.map((id) => <button key={id} className={styles.productTab} aria-pressed={selected === id} onClick={() => setSelected(id)}><ProductArt id={id} /><span>{PRODUCTS[id].name}<small>{state.inventory[id]} in stock{state.delivery?.productId === id ? ' · +2 incoming' : state.inventory[id] < 2 ? ' · Low stock' : ''}</small></span></button>)}</div>
              <div className={styles.restockDetails}><p><strong>{selectedProduct.name}</strong> · {money(selectedProduct.cost)} per unit · +{RESTOCK_UNITS} per order</p><div className={styles.actionGrid}>{(['standard', 'express'] as const).map((speed) => { const cost = selectedProduct.cost * RESTOCK_UNITS + (speed === 'express' ? 30 : 0); return <button key={speed} disabled={Boolean(state.delivery) || state.cash < cost} className={styles.stockButton} onClick={() => dispatch({ type: 'restock', productId: selected, speed, now: Date.now() })}><PackagePlus size={18} aria-hidden="true" /><span>{speed === 'standard' ? 'Standard · 4s' : 'Express · 1s'}<strong>{money(cost)} total{speed === 'express' ? ' · includes LKR 30 fee' : ''}</strong></span></button>; })}</div>{state.cash < selectedProduct.cost * RESTOCK_UNITS && <p className={styles.muted}>Insufficient cash for this purchase.</p>}</div>
              <div className={styles.deliveryStatus} aria-label="Delivery status"><Truck size={21} aria-hidden="true" /><div>{state.delivery ? <><strong>{PRODUCTS[state.delivery.productId].name} · +2 incoming · {state.delivery.speed}</strong><span>{Math.max(0, Math.ceil((state.delivery.completesAt - state.now) / 1000))}s until arrival · one delivery at a time</span><progress value={deliveryProgress} max={100} aria-label="Delivery progress" /></> : <><strong>Delivery bay ready</strong><span>Stock is added only when your delivery arrives.</span></>}</div></div>
            </section>
          </div>
          <div className={styles.checkoutColumn}><section id="rush-checkout" ref={checkout} className={styles.checkoutPanel} aria-label="Checkout counter"><div className={styles.sectionTitle}><p className={styles.eyebrow}>POS / CHECKOUT</p><span className={styles.openBadge}>OPEN</span></div><h2>Customer {customer?.id ?? '—'} of 6</h2>
              {customer && product ? <><div key={customer.id} className={styles.order}><ProductArt id={customer.productId} /><div><span className={styles.muted}>I’d like to buy</span><h3>{customer.quantity} × {product.name}</h3><p>Budget <strong>{money(customer.budget)}</strong></p></div></div>{patienceSeconds !== null ? <div className={styles.patience}><span>Customer patience <strong>{patienceSeconds}s</strong></span><progress value={patienceSeconds} max={10} aria-label="Customer patience" /></div> : <p className={styles.muted}>Practice · no customer deadline</p>}<p className={styles.checkoutHint}>Choose a price to confirm the complete order.</p><div className={styles.checkoutActions}><button className={styles.primaryButton} onClick={() => dispatch({ type: 'checkout', price: 'standard', now: Date.now() })}>Standard Price <strong>{money(product.standardPrice * customer.quantity)}</strong></button><button className={styles.secondaryButton} onClick={() => dispatch({ type: 'checkout', price: 'offer', now: Date.now() })}>Offer Deal <strong>{money(product.offerPrice * customer.quantity)}</strong></button></div></> : <div className={styles.waiting}><ShoppingBasket size={40} aria-hidden="true" /><h3>{nextSeconds !== null ? `Next customer in ${nextSeconds}s` : 'Preparing your shift report'}</h3><p>Use this moment to restock before the next order.</p></div>}
              <p key={state.message} className={`${styles.feedback} ${state.message.includes('served for') ? styles.success : state.message.includes('cannot afford') || state.message.includes('Not enough') ? styles.rejected : ''}`} role="status">{state.message || 'Welcome! Your first customer is ready.'}</p>
            </section><section className={styles.progressPanel}><div className={styles.sectionTitle}><h2>The six-customer shift</h2><span>{served}/6 served</span></div><ol className={styles.customerProgress}>{state.customerStatuses.map((status, index) => <li key={index} className={styles[status]} aria-label={`Customer ${index + 1}: ${status}`}><span>{index + 1}</span><small>{CUSTOMERS[index].arrivalSeconds}s</small></li>)}</ol><p className={styles.muted}>All money is fictional. Sound is off.</p></section></div>
        </div>
      </>}
    </div>
    {nameOpen && <PlayerNameModal initialName={playerName} onClose={() => setNameOpen(false)} onConfirm={(name) => {
      if (!rememberPlayerName(name)) return;
      setPlayerName(name); setNameOpen(false);
    }} />}
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className={styles.metric}><span>{label}</span><strong>{value}</strong></div>; }


