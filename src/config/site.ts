import type { Metadata } from 'next';

export function getPlayBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.trim().replace(/\/$/, '');
  }
  return 'https://play.techromzit.com';
}

export function getInstituteBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_INSTITUTE_URL) {
    return process.env.NEXT_PUBLIC_INSTITUTE_URL.trim().replace(/\/$/, '');
  }
  return 'https://techromzit.com';
}

export function getAiMasterShareUrl(level: 1 | 2 = 1): string {
  const base = getPlayBaseUrl();
  const query = level === 2 ? '?level=2&' : '?';
  return `${base}/ai-master${query}utm_source=player_share&utm_medium=social&utm_campaign=ai_master`;
}

export function getRetailRushShareUrl(scenario = 'retail-001', v = '1'): string {
  const base = getPlayBaseUrl();
  return `${base}/retail-rush?scenario=${scenario}&v=${v}&utm_source=player_share&utm_medium=social&utm_campaign=retail_rush`;
}

export function getAppBuilderShareUrl(): string {
  return `${getPlayBaseUrl()}/app-builder?utm_source=player_share&utm_medium=social&utm_campaign=app_builder_level1`;
}

export function getMobileKickstartUrl(content = 'result_cta'): string {
  return `${getInstituteBaseUrl()}/institute/courses/mobile-kickstart?utm_source=techromz_play&utm_medium=organic_social&utm_campaign=app_builder_level1&utm_content=${encodeURIComponent(content)}`;
}

export const playIndexingEnabled = process.env.PLAY_ALLOW_INDEXING === 'true';

type PlayMetadataOptions = {
  indexable?: boolean;
};

export function playMetadata(
  path: string,
  title: Metadata['title'],
  description: string,
  image = '/images/institute/play/ai-master-og-v2.jpg',
  options: PlayMetadataOptions = {}
): Metadata {
  const canonicalPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = getPlayBaseUrl();
  const canonicalUrl = `${baseUrl}${canonicalPath}`;
  const imageUrl = image.startsWith('http') ? image : `${baseUrl}${image.startsWith('/') ? image : `/${image}`}`;
  const indexing = playIndexingEnabled && options.indexable !== false;

  return {
    metadataBase: new URL(baseUrl),
    title: typeof title === 'string' && title.includes('Techromz Play') ? { absolute: title } : title,
    description,
    robots: { index: indexing, follow: indexing },
    alternates: { canonical: canonicalUrl },
    twitter: {
      card: 'summary_large_image',
      title: typeof title === 'string' ? title : 'Techromz Play — Educational Games',
      description,
      images: [imageUrl],
    },
    openGraph: {
      title: typeof title === 'string' ? title : 'Techromz Play — Educational Games',
      description,
      siteName: 'Techromz Play',
      type: 'website',
      url: canonicalUrl,
      locale: 'en_US',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: typeof title === 'string' ? title : 'Techromz Play',
        },
      ],
    },
  };
}
