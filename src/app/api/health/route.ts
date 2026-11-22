import { NextResponse } from 'next/server';
import { getPlayBaseUrl } from '@/config/site';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'techromz-play-standalone',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      baseUrl: getPlayBaseUrl(),
      features: {
        aiMaster: true,
        retailRush: true,
        knowledgeLab: true,
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
