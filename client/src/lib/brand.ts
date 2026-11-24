/**
 * OpusZenPro Brand & Site Configuration.
 * Centralized brand metadata and environment-aware domain helpers.
 */

export const BRAND_NAME = 'OpusZenPro';
export const SITE_NAME = 'OpusZenPro';
export const SITE_TITLE = 'OpusZenPro — Claude LLM Proxy & High-Capacity API Gateway';
export const SITE_DESCRIPTION =
  'High-capacity Anthropic Claude API gateway with 5-hour rolling windows, drop-in SDK compatibility, and instant UPI activation in INR.';
export const CLI_COMMAND = 'npx opuszenpro';
export const BRAND_PRIMARY_COLOR = '#EA580C';
export const BRAND_SECONDARY_COLOR = '#00D0FE';
export const DEFAULT_API_DOMAIN = 'https://api.opuszen.pro';
export const DEFAULT_SITE_URL = 'https://opuszen.pro';

export function getApiDomain(): string {
  const envDomain = import.meta.env.VITE_API_DOMAIN;
  if (typeof envDomain === 'string' && envDomain.trim()) {
    return envDomain.trim().replace(/\/+$/, '');
  }
  return DEFAULT_API_DOMAIN;
}

export function getSiteUrl(): string {
  const envUrl = import.meta.env.VITE_SITE_URL;
  if (typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_SITE_URL;
}

