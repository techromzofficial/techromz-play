'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PlayerNameModal from './PlayerNameModal';
import { getPlayerName, rememberPlayerName } from './PlayerNameSession';

const route = '/retail-rush';

function EntryModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  return <PlayerNameModal initialName={getPlayerName()} onClose={onClose} onConfirm={(name) => {
    rememberPlayerName(name);
    onClose();
    router.push(route);
  }} />;
}

export default function RetailRushEntry({ className, children }: { className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <><Link href={route} className={className} onClick={(event) => {
    // Preserve open-in-new-tab/link semantics; direct entry also has the name gate.
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); setOpen(true);
  }}>{children}</Link>{open && <EntryModal onClose={() => setOpen(false)} />}</>;
}
