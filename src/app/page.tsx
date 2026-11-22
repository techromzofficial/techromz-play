import type { Metadata } from 'next';
import PlayPortal from './PlayPortal';
import { playMetadata } from '@/config/site';

// Homepage card contract retained for the App Builder platform test: Mission 003 / Play App Builder.

export const metadata: Metadata = playMetadata(
  '/',
  'Techromz Play | Free Educational Games | Techromz Institute',
  'Explore free interactive technology games and timed challenges. Build AI, retail, and app-development skills with Techromz Play.'
);

export default function TechromzPlayPage() {
  return <PlayPortal />;
}
