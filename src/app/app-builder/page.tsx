import type { Metadata } from 'next';
import { playMetadata } from '@/config/site';
import AppBuilderOverview from '@/features/games/app-builder/AppBuilderOverview';

const title = 'App Builder Level 1 – Build Your First App | Techromz Play';
const description = 'Design, connect, program, test, and debug a simulated Study Planner in a free 90-second challenge or untimed practice mode.';

export const metadata: Metadata = playMetadata('/app-builder', title, description, '/images/play/app-builder/app-builder-og.png');

export default function AppBuilderPage() {
  return <AppBuilderOverview />;
}
