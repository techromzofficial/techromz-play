import type { Metadata } from 'next';
import { playMetadata } from '@/config/site';
import AiMasterGame from '@/features/games/ai-master/AiMasterGame';

const level1Title = 'AI Master – Free 30-Second AI Challenge | Techromz Play';
const level1Description =
  'Build and test a simulated AI assistant in 30 seconds. Play free, challenge yourself and discover practical AI skills. No registration required.';
const image = '/images/institute/play/ai-master-og-v2.jpg';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ level?: string }> }): Promise<Metadata> {
  const level2 = (await searchParams).level === '2';
  return playMetadata(
    level2 ? '/ai-master?level=2' : '/ai-master',
    level2 ? 'AI Knowledge Lab – Build a Trustworthy AI Assistant | Techromz Play' : level1Title,
    level2 ? 'Complete the AI Knowledge Lab by connecting verified sources, configuring safe behaviour, testing grounded answers and repairing unsupported claims.' : level1Description,
    image
  );
}

export default function AiMasterPage() {
  return <AiMasterGame />;
}
