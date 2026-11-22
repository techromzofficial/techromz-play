'use client';

import { useState, type DragEvent } from 'react';
import { ArrowRight, Bot, Check, Database, Grip, Link2, Plus, ScanLine, ShieldCheck, Sparkles, UserRound, Wrench, X } from 'lucide-react';
import AiCompanion from './AiCompanion';
import { isLevel2TestCorrect, level2Instructions, level2Sources, level2Tests, type Level2AnswerId, type Level2InstructionId, type Level2SourceId, type Level2State } from './levels/level2';
import { buildLabResponse, fragmentSlots, repairModules, responseFragments, type FragmentSlot, type LabCitation, type RepairModuleId, type ResponseParts } from './labInteraction';
import styles from './KnowledgeLab.module.css';

const MIME = 'application/x-techromz-lab';
export function beginLabDrag(event: DragEvent, kind: string, id: string) {
  event.dataTransfer.setData(MIME, `${kind}:${id}`);
  event.dataTransfer.effectAllowed = 'move';
}
function readDrop(event: DragEvent, kind: string) {
  event.preventDefault();
  const payload = event.dataTransfer.getData(MIME);
  return payload.startsWith(`${kind}:`) ? payload.slice(kind.length + 1) : null;
}
function allowDrop(event: DragEvent) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }

export type CoreState = 'Standby' | 'Receiving knowledge' | 'Processing' | 'Ready' | 'Missing evidence' | 'Response complete' | 'Error detected' | 'Repaired';
export function KnowledgeCore({ state, status, children }: { state: Level2State; status: CoreState; children?: React.ReactNode }) {
  const warning = status === 'Missing evidence' || status === 'Error detected';
  const happy = status === 'Repaired' || status === 'Response complete' || status === 'Ready';
  return <aside className={`${styles.coreTower} ${warning ? styles.coreWarning : ''}`} aria-label="AI Knowledge Core">
    <div className={styles.coreHeader}><Bot size={18} aria-hidden="true" /><span>AI KNOWLEDGE CORE</span><i aria-hidden="true" /></div>
    <div className={styles.coreRobot}><AiCompanion responsive level={state.phase === 'sources' ? state.selectedSources.length ? 1 : 0 : state.phase === 'configure' ? 2 : 3} mood={warning ? 'encourage' : happy ? 'celebrate' : undefined} /></div>
    <p className={styles.coreState} role="status"><span aria-hidden="true" />{status}</p>
    {(state.phase === 'sources' || state.phase === 'configure') && <svg className={styles.connectionWires} viewBox="0 0 300 40" aria-hidden="true">{[0, 1].map(index => {
      const id = state.phase === 'sources' ? state.sourceSlots[index] : state.instructionSlots[index];
      return <path key={`${index}-${id}`} d={index === 0 ? 'M150 0 C150 25 75 12 75 40' : 'M150 0 C150 25 225 12 225 40'} className={id ? styles.wirePowered : styles.wireStandby} pathLength="100" />;
    })}</svg>}
    {children}
    {state.phase !== 'sources' && <div className={styles.connectedEvidence}><strong>Connected evidence</strong>{state.selectedSources.map(id => {
      const source = level2Sources.find(item => item.id === id)!;
      return <details key={id}><summary><Database size={14} aria-hidden="true" />{source.title}</summary><p>{source.content}</p></details>;
    })}</div>}
    <svg className={styles.energyBase} viewBox="0 0 300 40" aria-hidden="true"><ellipse cx="150" cy="20" rx="130" ry="14" /><ellipse cx="150" cy="20" rx="96" ry="9" /></svg>
  </aside>;
}

type ComponentSlotsProps<T extends string> = {
  kind: string;
  title: string;
  slots: [T | null, T | null];
  pending: T | null;
  items: readonly { id: T; title: string }[];
  onPlace: (slot: 0 | 1, id: T | null) => void;
};
export function ComponentSlots<T extends string>({ kind, title, slots, pending, items, onPlace }: ComponentSlotsProps<T>) {
  return <div className={styles.socketBank} aria-label={`${title} connections`}>
    {slots.map((id, index) => {
      const label = items.find(item => item.id === id)?.title;
      return <div key={index} className={`${styles.socket} ${id ? styles.socketFilled : ''} ${pending ? styles.socketArmed : ''}`}>
        <button type="button" aria-label={`${title} slot ${index + 1}: ${label ?? 'empty'}`} onDragOver={allowDrop} onDrop={event => {
          const dropped = readDrop(event, kind);
          const item = items.find(item => item.id === dropped);
          if (item) onPlace(index as 0 | 1, item.id);
        }} onClick={() => { if (pending) onPlace(index as 0 | 1, pending); }}>
          <span className={styles.socketNumber}>{String(index + 1).padStart(2, '0')}</span>
          {id ? <Link2 size={23} aria-hidden="true" /> : <Plus size={23} aria-hidden="true" />}
          <strong>{label ?? (pending ? 'Connect here' : 'Empty connection')}</strong>
          <small>{id ? 'Component connected' : 'Drop here or select a component first'}</small>
        </button>
        {id && <button type="button" className={styles.removeComponent} aria-label={`Remove ${label} from ${title.toLowerCase()} slot ${index + 1}`} onClick={() => onPlace(index as 0 | 1, null)}><X size={16} aria-hidden="true" /></button>}
      </div>;
    })}
  </div>;
}

export function SourceHunt({ state, onPlace, onConfirm }: { state: Level2State; onPlace: (slot: 0 | 1, id: Level2SourceId | null) => void; onConfirm: () => void }) {
  const [pending, setPending] = useState<Level2SourceId | null>(null);
  return <div className={styles.workbenchGrid}>
    <div className={styles.toolShelf}>
      <div className={styles.sectionLabel}><Database size={16} aria-hidden="true" /> EVIDENCE SHELF <span>4 sources</span></div>
      <h2>Source Hunt</h2><p>Inspect the evidence. Drag a card to a core slot, or select it and tap a slot. Connect exactly two.</p>
      <div className={styles.sourceGrid}>{level2Sources.map(source => <article key={source.id} className={`${styles.sourceCard} ${pending === source.id ? styles.armedCard : ''}`}>
        <button type="button" draggable onDragStart={event => beginLabDrag(event, 'source', source.id)} aria-pressed={pending === source.id} onClick={() => setPending(pending === source.id ? null : source.id)}>
          <span className={styles.componentIcon}><Database size={24} aria-hidden="true" /></span><strong>{source.title}</strong><Grip size={15} aria-hidden="true" />
          <small>{state.selectedSources.includes(source.id) ? 'Connected · select to move' : 'Select to connect'}</small>
        </button>
        <details><summary>Inspect evidence</summary><p>{source.content}</p><span className={styles.provenance}>Provenance: {source.trust === 'verified' ? 'Official shop record' : source.trust === 'outdated' ? 'Last month’s promotion' : 'Public, unverified comment'}</span></details>
      </article>)}</div>
      <p className={styles.selectionNotice} role="status">{pending ? `${level2Sources.find(item => item.id === pending)?.title} selected. Choose a core slot.` : 'No component selected. Inspect a source to check freshness.'}</p>
    </div>
    <KnowledgeCore state={state} status={state.selectedSources.length === 2 ? 'Ready' : state.selectedSources.length ? 'Receiving knowledge' : 'Standby'}>
      <ComponentSlots kind="source" title="Source" slots={state.sourceSlots} pending={pending} items={level2Sources} onPlace={(slot, id) => { onPlace(slot, id); setPending(null); }} />
      <p className={styles.connectionCount} aria-live="polite">{state.selectedSources.length}/2 Sources Connected</p>
      <button className={styles.primaryAction} disabled={state.selectedSources.length !== 2} onClick={onConfirm}>Connect Sources <ArrowRight size={19} aria-hidden="true" /></button>
    </KnowledgeCore>
  </div>;
}

export function CoreConfiguration({ state, onPlace, onConfirm }: { state: Level2State; onPlace: (slot: 0 | 1, id: Level2InstructionId | null) => void; onConfirm: () => void }) {
  const [pending, setPending] = useState<Level2InstructionId | null>(null);
  return <div className={styles.workbenchGrid}>
    <div className={styles.toolShelf}>
      <div className={styles.sectionLabel}><ShieldCheck size={16} aria-hidden="true" /> BEHAVIOR MODULES <span>2 slots</span></div>
      <h2>Program the assistant</h2><p>Install two behavior modules. Drag them onto the panel or select a module, then choose a slot. Remove or replace them before activation.</p>
      <div className={styles.optionGrid}>{level2Instructions.map((item, index) => <button type="button" key={item.id} draggable onDragStart={event => beginLabDrag(event, 'behavior', item.id)} onClick={() => setPending(pending === item.id ? null : item.id)} aria-pressed={pending === item.id} className={`${styles.moduleCard} ${pending === item.id ? styles.armedCard : ''}`}>
        <span className={styles.moduleIndex} aria-hidden="true">MODULE {String(index + 1).padStart(2, '0')} <Grip size={15} aria-hidden="true" /></span><ShieldCheck size={26} aria-hidden="true" /><strong>{item.title}</strong><small>{item.detail}</small>
      </button>)}</div>
      <p className={styles.selectionNotice} role="status">{pending ? 'Module selected. Choose a behavior slot to install it.' : 'The installed modules will shape the assistant’s behavior.'}</p>
    </div>
    <KnowledgeCore state={state} status={state.selectedInstructions.length === 2 ? 'Ready' : 'Processing'}>
      <ComponentSlots kind="behavior" title="Behavior" slots={state.instructionSlots} pending={pending} items={level2Instructions} onPlace={(slot, id) => { onPlace(slot, id); setPending(null); }} />
      <p className={styles.connectionCount} aria-live="polite">{state.selectedInstructions.length}/2 Modules Installed</p>
      <button className={styles.primaryAction} disabled={state.selectedInstructions.length !== 2} onClick={onConfirm}>Activate Configuration <Sparkles size={18} aria-hidden="true" /></button>
    </KnowledgeCore>
  </div>;
}

export function EvidenceChallenge({ state, onSubmit }: { state: Level2State; onSubmit: (answerId: Level2AnswerId, citation: LabCitation, text: string) => void }) {
  const test = level2Tests[state.currentTestIndex];
  const [parts, setParts] = useState<ResponseParts>({});
  const [uncertain, setUncertain] = useState(false);
  const [citation, setCitation] = useState<LabCitation>('');
  const [notice, setNotice] = useState('Select fragments to build a response, then connect its evidence.');
  const response = buildLabResponse(test.id, parts, uncertain);
  const lastTest = state.confirmedTests[state.confirmedTests.length - 1];
  const installFragment = (id: string, target?: FragmentSlot) => {
    const item = responseFragments[test.id].find(fragment => fragment.id === id);
    if (!item || target && target !== item.slot) { setNotice('Connect this fragment to its matching labeled socket.'); return; }
    setUncertain(false); setParts(current => ({ ...current, [item.slot]: id })); setNotice(`${item.text} connected to ${item.slot}.`);
  };
  return <div className={styles.workbenchGrid}>
    <div className={styles.chatWorkspace}>
      <div className={styles.sectionLabel}><UserRound size={16} aria-hidden="true" /> CUSTOMER SIMULATION <span>{state.currentTestIndex + 1}/2</span></div>
      <div className={styles.chatThread} aria-label="Customer conversation">
        {state.confirmedTests.map(id => <div key={id} className={styles.previousChat}><Check size={15} aria-hidden="true" /><span>{level2Tests.find(item => item.id === id)?.question}<small>Response recorded: {state.testSelections[id]?.responseText ?? 'Simulation complete'}</small></span></div>)}
        <div className={styles.customerBubble}><span className={styles.avatar}><UserRound size={23} aria-hidden="true" /></span><div><strong>Shop customer</strong><p>{test.question}</p></div></div>
      </div>
      <div className={styles.responseConsole}>
        <div className={styles.consoleHeading}><Bot size={20} aria-hidden="true" /><h2>Build the AI response</h2><span>LOCAL SIMULATION</span></div>
        <p>Tap fragments to install them, or drag them to their matching sockets. Connected evidence is available in the core.</p>
        <div className={styles.fragmentShelf}>{fragmentSlots.map(slot => <div key={slot}><strong>{slot}</strong><div>{responseFragments[test.id].filter(item => item.slot === slot).map(item => <button type="button" key={item.id} draggable onDragStart={event => beginLabDrag(event, 'fragment', item.id)} aria-pressed={!uncertain && parts[slot] === item.id} onClick={() => installFragment(item.id)} className={styles.fragmentToken}>{item.text}<Grip size={13} aria-hidden="true" /></button>)}</div></div>)}</div>
        <div className={styles.responseSockets} aria-label="Response construction sockets">{fragmentSlots.map(slot => <button type="button" key={slot} className={`${styles.responseSocket} ${parts[slot] && !uncertain ? styles.socketFilled : ''}`} aria-label={`${slot} response socket`} onClick={() => { setUncertain(false); setParts(current => ({ ...current, [slot]: undefined })); }} onDragOver={allowDrop} onDrop={event => { const id = readDrop(event, 'fragment'); if (id) installFragment(id, slot); }}><small>{slot}</small><span>{!uncertain && responseFragments[test.id].find(item => item.id === parts[slot])?.text || 'Drop fragment'}</span>{parts[slot] && !uncertain && <X size={14} aria-hidden="true" />}</button>)}</div>
        <button type="button" aria-pressed={uncertain} className={styles.uncertaintyToken} onClick={() => { setUncertain(!uncertain); setParts({}); }}><ScanLine size={18} aria-hidden="true" /><span>Use uncertainty response<small>Not enough verified information.</small></span></button>
        <div className={styles.responsePreview} aria-label="AI response preview"><Bot size={20} aria-hidden="true" /><p>{response?.text ?? 'Your assembled response will appear here.'}</p></div>
        <p role="status" className={styles.selectionNotice}>{notice}</p>
      </div>
    </div>
    <KnowledgeCore state={state} status={uncertain ? 'Missing evidence' : response ? 'Ready' : lastTest ? isLevel2TestCorrect(state, lastTest) ? 'Response complete' : 'Error detected' : 'Processing'}>
      <div className={styles.citationWorkspace}><h3>Connect a citation</h3><p>Cite evidence actually connected to your core, or explicitly choose no source.</p>
        <div className={styles.evidenceTokens}>{state.selectedSources.map(id => <button type="button" key={id} draggable onDragStart={event => beginLabDrag(event, 'citation', id)} aria-pressed={citation === id} onClick={() => setCitation(id)}><Link2 size={16} aria-hidden="true" />{level2Sources.find(item => item.id === id)?.title}</button>)}<button type="button" draggable onDragStart={event => beginLabDrag(event, 'citation', 'none')} aria-pressed={citation === 'none'} onClick={() => setCitation('none')}>No source</button></div>
        <button type="button" className={`${styles.citationSocket} ${citation ? styles.socketFilled : ''}`} aria-label="Source citation socket" onClick={() => setCitation('')} onDragOver={allowDrop} onDrop={event => { const id = readDrop(event, 'citation'); if (id === 'none' || state.selectedSources.includes(id as Level2SourceId)) setCitation(id as LabCitation); }}><Link2 size={20} aria-hidden="true" /><span>{citation === 'none' ? 'No source' : level2Sources.find(item => item.id === citation)?.title ?? 'Drop evidence here'}</span>{citation && <X size={14} aria-hidden="true" />}</button>
      </div>
      <button className={styles.primaryAction} disabled={!response || !citation} onClick={() => { if (response && citation) onSubmit(response.answerId, citation, response.text); }}>Run AI Response <ArrowRight size={19} aria-hidden="true" /></button>
      <p className={styles.actionHint}>15 points · response + citation must match</p>
    </KnowledgeCore>
  </div>;
}

export function RepairLab({ state, onSubmit }: { state: Level2State; onSubmit: (modules: [RepairModuleId | null, RepairModuleId | null], flagged: boolean) => void }) {
  const [flagged, setFlagged] = useState(false);
  const [slots, setSlots] = useState<[RepairModuleId | null, RepairModuleId | null]>([null, null]);
  const [pending, setPending] = useState<RepairModuleId | null>(null);
  return <div className={styles.workbenchGrid}>
    <div className={styles.toolShelf}>
      <div className={styles.sectionLabel}><Wrench size={16} aria-hidden="true" /> DEBUGGING WORKSPACE <span>Model C</span></div><h2>Inspect. Flag. Repair.</h2>
      <div className={styles.customerBubble}><UserRound size={22} aria-hidden="true" /><div><strong>Shop customer</strong><p>Is Model C in stock?</p></div></div>
      <div className={`${styles.claimMonitor} ${flagged ? styles.claimFlagged : ''}`}><span>ASSISTANT RESPONSE MONITOR</span><p>“Yes, Model C is available. I can promise it is in stock.”</p><button type="button" aria-pressed={flagged} onClick={() => setFlagged(!flagged)}><ScanLine size={18} aria-hidden="true" />{flagged ? 'Claim flagged for evidence review' : 'Flag unsupported claim'}</button></div>
      <p>Inspect the connected evidence in the core. Flag the claim, then install two repair actions. Drag an action or select it and choose a socket.</p>
      <div className={styles.repairModules}>{repairModules.map(item => <button type="button" key={item.id} draggable onDragStart={event => beginLabDrag(event, 'repair', item.id)} aria-pressed={pending === item.id} onClick={() => setPending(pending === item.id ? null : item.id)}><Wrench size={18} aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.detail}</small></span><Grip size={15} aria-hidden="true" /></button>)}</div>
    </div>
    <KnowledgeCore state={state} status={flagged ? 'Missing evidence' : 'Error detected'}>
      <div className={styles.repairConsole}><h3>Repair pipeline</h3><p>First acknowledge the problem; then decide what the assistant should do next.</p>
        <ComponentSlots kind="repair" title="Repair" slots={slots} pending={pending} items={repairModules} onPlace={(index, id) => {
          setSlots(current => { const next: typeof current = [...current]; if (id) { if (next[0] === id) next[0] = null; if (next[1] === id) next[1] = null; } next[index] = id; return next; }); setPending(null);
        }} />
      </div>
      <p className={styles.connectionCount} role="status">{flagged ? 'Evidence review active' : 'Inspect and flag the claim'} · {slots.filter(Boolean).length}/2 repair actions</p>
      <button className={styles.primaryAction} disabled={!flagged || slots.some(id => !id)} onClick={() => onSubmit(slots, flagged)}>Apply Repair <Wrench size={18} aria-hidden="true" /></button>
    </KnowledgeCore>
  </div>;
}
