import { Suspense } from 'react';
import type { Metadata } from 'next';
import { playMetadata } from '@/config/site';
import AppBuilderGame from '@/features/games/app-builder/AppBuilderGame';

const title = 'Play App Builder Level 1 | Techromz Play';
const description = 'Build and debug a simulated Study Planner through four interactive app-development stages. Free, beginner-friendly, and no registration required.';

export const metadata: Metadata = playMetadata('/app-builder/level-1', title, description, '/images/play/app-builder/app-builder-og.png');

export default function AppBuilderLevelOnePage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#0B1530] p-10 text-center text-white">Loading App Builder…</main>}><AppBuilderGame /></Suspense>;
}
