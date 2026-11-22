import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */

const analyticsEnabled =
  process.env.NEXT_PUBLIC_PLAY_ANALYTICS_ENABLED === 'true';

const playCsp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"}${analyticsEnabled ? ' https://www.googletagmanager.com' : ''}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://techromzit.com${analyticsEnabled ? ' https://www.googletagmanager.com https://*.google-analytics.com' : ''}`,
  "font-src 'self' data:",
  `connect-src 'self' ws: wss:${analyticsEnabled ? ' https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com' : ''}`,
  "manifest-src 'self'",
  "media-src 'self'",
  ...(process.env.NODE_ENV === 'production' ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: playCsp },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const nextConfig = {
  // Keep metadata in head for crawlers
  htmlLimitedBots: /.*/,

  distDir: process.env.NEXT_DIST_DIR || '.next',

  images: {
    unoptimized: true,
  },

  outputFileTracingRoot: path.resolve(__dirname),

  async redirects() {
    return [
      {
        source: '/institute/play',
        destination: '/',
        permanent: false,
      },
      {
        source: '/institute/play/ai-master',
        destination: '/ai-master',
        permanent: false,
      },
      {
        source: '/institute/play/retail-rush',
        destination: '/retail-rush',
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },

  webpack: (config, { dev }) => {
    if (dev && process.platform === 'win32') {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
