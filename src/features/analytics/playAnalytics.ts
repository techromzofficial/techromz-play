'use client';

import { getPlayBaseUrl } from '../../config/site';

export const analyticsEnabled =
  process.env.NEXT_PUBLIC_PLAY_ANALYTICS_ENABLED === 'true';

const measurementId =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-TPH2VY63MB';

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  techromzPlayAnalyticsConsent?: boolean;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

let initialized = false;

export function enablePlayAnalytics() {
  if (!analyticsEnabled || typeof window === 'undefined') return;

  const w = window as unknown as AnalyticsWindow;
  w[`ga-disable-${measurementId}`] = false;

  if (initialized) return;

  w.dataLayer = w.dataLayer || [];
  w.gtag = function () {
    w.dataLayer!.push(arguments);
  };

  w.gtag('js', new Date());
  w.gtag('config', measurementId, {
    send_page_view: false,
    page_location: getPlayBaseUrl(),
    page_title: 'Techromz Play',
  });

  const script = document.createElement('script');
  script.id = 'techromz-play-google-analytics';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  initialized = true;
}

export type AiMasterEvent =
  | {
      name: 'game_started';
      game_mode: 'timed' | 'practice';
    }
  | {
      name: 'game_completed' | 'game_timeout';
      game_mode: 'timed' | 'practice';
      game_score: number;
    }
  | {
      name: 'challenge_share_action';
      share_method: 'clipboard' | 'native_share' | 'facebook' | 'whatsapp';
    }
  | {
      name: 'course_clicked' | 'course_cta_click';
      level?: number;
      game_mode?: 'timed' | 'practice';
    }
  | {
      name: 'mission_start' | 'replay';
      level: 2;
      game_mode: 'timed' | 'practice';
    }
  | {
      name: 'level_unlock';
      level: 2;
      game_mode: 'timed' | 'practice';
    }
  | {
      name: 'stage_complete';
      level: 2;
      game_mode: 'timed' | 'practice';
      stage: 'sources' | 'configuration' | 'test_1' | 'test_2' | 'repair';
      score_band: '0-39' | '40-69' | '70-79' | '80-100';
    }
  | {
      name: 'mission_complete';
      level: 2;
      game_mode: 'timed' | 'practice';
      completion: 'completed' | 'timeout';
      score_band: '0-39' | '40-69' | '70-79' | '80-100';
    }
  | {
      name: 'share_click';
      level: 2;
      game_mode: 'timed' | 'practice';
      share_method: 'clipboard' | 'native_share';
    };

export function trackAiMasterEvent(event: AiMasterEvent) {
  if (!analyticsEnabled || typeof window === 'undefined') return;

  try {
    const w = window as unknown as AnalyticsWindow;
    const { name, ...parameters } = event;

    w.gtag?.('event', name, {
      ...parameters,
      send_to: measurementId,
      game_name: 'ai_master',
      page_location: `${getPlayBaseUrl()}/ai-master`,
      page_title: 'AI Master',
    });
  } catch {
    // Analytics must never interrupt gameplay.
  }
}

export type AppBuilderEvent =
  | { name: 'app_builder_view' }
  | { name: 'app_builder_start' | 'app_builder_replay'; game_mode: 'challenge' | 'practice' }
  | { name: 'app_builder_stage_complete'; game_mode: 'challenge' | 'practice'; stage: 1 | 2 | 3 | 4; score_band: '0-39' | '40-69' | '70-79' | '80-100' }
  | { name: 'app_builder_finish'; game_mode: 'challenge' | 'practice'; game_score: number; completion: 'completed' | 'timeout' }
  | { name: 'app_builder_share'; game_mode: 'challenge' | 'practice'; share_method: 'clipboard' | 'native_share' | 'facebook' | 'whatsapp' }
  | { name: 'app_builder_course_click'; game_mode?: 'challenge' | 'practice'; score_band?: '0-39' | '40-69' | '70-79' | '80-100' };

export function trackAppBuilderEvent(event: AppBuilderEvent) {
  if (!analyticsEnabled || typeof window === 'undefined') return;
  try {
    const w = window as unknown as AnalyticsWindow;
    // App Builder stays silent until an approved consent integration sets this explicit runtime signal.
    if (w.techromzPlayAnalyticsConsent !== true) return;
    const { name, ...parameters } = event;
    w.gtag?.('event', name, {
      ...parameters,
      send_to: measurementId,
      game_name: 'app_builder',
      page_location: `${getPlayBaseUrl()}/app-builder`,
      page_title: 'App Builder',
    });
  } catch {
    // Analytics must never interrupt gameplay.
  }
}
