import type { Metadata } from 'next';
import { playMetadata } from '@/config/site';
import RetailRushGame from '@/features/games/retail-rush/RetailRushGame';

const title = 'Retail Rush – Free 60-Second Retail Game | Techromz Play';
const description =
  'Manage a fictional retail store in 60 seconds. Serve customers, price orders and restock inventory in this free Techromz Play challenge.';
const image = '/images/institute/play/retail-rush-og-v1.png';

export const metadata: Metadata = playMetadata(
  '/retail-rush',
  title,
  description,
  image
);

export default function RetailRushPage() {
  return <RetailRushGame />;
}
