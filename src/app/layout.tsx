import type { Metadata } from 'next';
import PlayHeader from '@/components/layout/PlayHeader';
import PlayFooter from '@/components/layout/PlayFooter';
import { playMetadata } from '@/config/site';
// @ts-ignore Next.js handles global stylesheet imports.
import './globals.css';

export const metadata: Metadata = {
  ...playMetadata(
    '/',
    'Techromz Play | Free Educational Games & AI Simulations',
    'Explore free interactive technology games, 30-second challenges, and real-time business simulations. Think, play, innovate with Techromz Play.'
  ),
  icons: {
    icon: '/images/institute/techromz-institute-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0B1530] text-white flex flex-col justify-between">
        <PlayHeader />
        <div className="flex-1">{children}</div>
        <PlayFooter />
      </body>
    </html>
  );
}
