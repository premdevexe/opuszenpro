import { useState, useEffect, useCallback, useMemo } from 'react';
import { getApiDomain } from './brand';

export interface LiveModelItem {
  id: string;
  name: string;
  context: string;
  badge?: string;
  description: string;
  cutoff: string;
  tier: 'flagship' | 'standard';
  createdAt?: string;
  isNew?: boolean;
}

// Curated metadata dictionary for known models to enhance raw API data
const KNOWN_METADATA: Record<string, Partial<LiveModelItem>> = {
  'claude-fable-5-2': {
    name: 'Claude Fable 5.2',
    context: '1M context',
    badge: 'Latest Flagship',
    description: 'The premier flagship model for frontier reasoning, complex multi-turn problem solving, and autonomous swarms.',
    cutoff: 'Nov 2026',
    tier: 'flagship',
  },
  'claude-sonnet-5-5': {
    name: 'Claude Sonnet 5.5',
    context: '1M context',
    badge: 'New & Fast',
    description: 'Frontier intelligence at breakthrough Sonnet speeds. Ideal for complex codebase refactoring and real-time agent loops.',
    cutoff: 'Sep 2026',
    tier: 'flagship',
  },
  'claude-opus-5-5': {
    name: 'Claude Opus 5.5',
    context: '1M context',
    badge: 'Deep Reasoning',
    description: 'Engineered for deep reflection and long-running autonomous knowledge tasks with extended chain-of-thought.',
    cutoff: 'Sep 2026',
    tier: 'flagship',
  },
  'claude-haiku-5-5': {
    name: 'Claude Haiku 5.5',
    context: '200K context',
    badge: 'Lightning Speed',
    description: 'Sub-second inference at ~180 tokens/sec. Built for rapid autocompletion, classification, and fast tool calling.',
    cutoff: 'Oct 2026',
    tier: 'flagship',
  },
  'claude-fable-5-1': {
    name: 'Claude Fable 5.1',
    context: '1M context',
    badge: 'Frontier Reasoning',
    description: 'Highly capable reasoning model for demanding knowledge synthesis and long-horizon agentic work with full 1M context.',
    cutoff: 'June 2026',
    tier: 'flagship',
  },
  'claude-3-7-sonnet-20250219': {
    name: 'Claude 3.7 Sonnet',
    context: '200K / 1M',
    badge: 'Hybrid Reasoning',
    description: 'Hybrid reasoning model capable of instant standard responses and extended thinking steps on demand.',
    cutoff: 'Nov 2024',
    tier: 'flagship',
  },
  'claude-fable-5': {
    name: 'Claude Fable 5',
    context: '1M context',
    description: 'Autonomous reasoning engine for deep analysis and complex workflows.',
    cutoff: 'June 2026',
    tier: 'standard',
  },
  'claude-opus-5': {
    name: 'Claude Opus 5',
    context: '1M context',
    description: 'Heavyweight cognitive synthesis and code architecture reasoning.',
    cutoff: 'July 2026',
    tier: 'standard',
  },
  'claude-sonnet-5': {
    name: 'Claude Sonnet 5',
    context: '1M context',
    description: 'Balanced speed and intelligence for developer agent workflows.',
    cutoff: 'July 2026',
    tier: 'standard',
  },
  'claude-opus-4-8': {
    name: 'Claude Opus 4.8',
    context: '1M context',
    description: 'Enterprise reasoning model with full 1M context window support.',
    cutoff: 'Early 2026',
    tier: 'standard',
  },
  'claude-opus-4-7': {
    name: 'Claude Opus 4.7',
    context: '1M context',
    description: 'High-reliability synthesis model with 1M tokens.',
    cutoff: 'Early 2026',
    tier: 'standard',
  },
  'claude-opus-4-6': {
    name: 'Claude Opus 4.6',
    context: '1M context',
    description: 'Proven frontier model for long-document comprehension and code generation.',
    cutoff: 'Late 2025',
    tier: 'standard',
  },
  'claude-sonnet-4-6': {
    name: 'Claude Sonnet 4.6',
    context: '1M context',
    description: 'Fast Sonnet architecture with 1M window for agent tool calling.',
    cutoff: 'Late 2025',
    tier: 'standard',
  },
  'claude-opus-4-5': {
    name: 'Claude Opus 4.5',
    context: '200K context',
    description: 'High-precision reasoning for complex logic and systems design.',
    cutoff: 'Mid 2025',
    tier: 'standard',
  },
  'claude-sonnet-4-5-20250929': {
    name: 'Claude Sonnet 4.5',
    context: '200K context',
    description: 'Optimized for high-speed agentic loops and refactoring.',
    cutoff: 'Sep 2025',
    tier: 'standard',
  },
  'claude-haiku-4-5-20251001': {
    name: 'Claude Haiku 4.5',
    context: '200K context',
    description: 'Ultra-fast inference for rapid queries and structured JSON extraction.',
    cutoff: 'Oct 2025',
    tier: 'standard',
  },
  'claude-3-5-sonnet-20241022': {
    name: 'Claude 3.5 Sonnet v2',
    context: '200K context',
    description: 'The proven workhorse for daily coding, agent scripts, and document reasoning.',
    cutoff: 'Oct 2024',
    tier: 'standard',
  },
  'claude-3-5-haiku-20241022': {
    name: 'Claude 3.5 Haiku',
    context: '200K context',
    description: 'Rapid, lightweight intelligence for fast autocomplete and classification.',
    cutoff: 'Oct 2024',
    tier: 'standard',
  },
  'claude-3-opus-20240229': {
    name: 'Claude 3 Opus',
    context: '200K context',
    description: 'Anthropic flagship reasoning pioneer with complex comprehension.',
    cutoff: 'Feb 2024',
    tier: 'standard',
  },
};

// Default initial catalog
const DEFAULT_FALLBACK_MODELS: LiveModelItem[] = [
  {
    name: 'Claude Fable 5.2',
    id: 'claude-fable-5-2',
    context: '1M context',
    badge: 'Latest Flagship',
    description: 'The premier flagship model in the lineup for frontier reasoning, complex multi-turn problem solving, and autonomous swarms.',
    cutoff: 'Nov 2026',
    tier: 'flagship',
    isNew: true,
  },
  {
    name: 'Claude Sonnet 5.5',
    id: 'claude-sonnet-5-5',
    context: '1M context',
    badge: 'New & Fast',
    description: 'Frontier intelligence at breakthrough Sonnet speeds. The optimal daily driver for complex codebase refactoring and real-time agent loops.',
    cutoff: 'Sep 2026',
    tier: 'flagship',
    isNew: true,
  },
  {
    name: 'Claude Opus 5.5',
    id: 'claude-opus-5-5',
    context: '1M context',
    badge: 'Deep Reasoning',
    description: 'Engineered for deep reflection and long-running autonomous knowledge tasks with extended chain-of-thought.',
    cutoff: 'Sep 2026',
    tier: 'flagship',
  },
  {
    name: 'Claude Haiku 5.5',
    id: 'claude-haiku-5-5',
    context: '200K context',
    badge: 'Lightning Speed',
    description: 'Sub-second inference at ~180 tokens/sec. Built for rapid autocompletion, classification, and fast tool calling.',
    cutoff: 'Oct 2026',
    tier: 'flagship',
  },
  {
    name: 'Claude Fable 5.1',
    id: 'claude-fable-5-1',
    context: '1M context',
    badge: 'Frontier Reasoning',
    description: 'Highly capable reasoning model for demanding knowledge synthesis and long-horizon agentic work with full 1M context.',
    cutoff: 'June 2026',
    tier: 'flagship',
  },
  {
    name: 'Claude 3.7 Sonnet',
    id: 'claude-3-7-sonnet-20250219',
    context: '200K / 1M',
    badge: 'Hybrid Reasoning',
    description: 'Hybrid reasoning model capable of instant standard responses and extended thinking steps on demand.',
    cutoff: 'Nov 2024',
    tier: 'flagship',
  },
];

// Helper to convert raw model ID into human-friendly title
function formatModelName(id: string): string {
  const clean = id.replace(/\[1m\]$/i, '').trim();
  const parts = clean.split('-');
  return parts
    .map((p) => {
      if (p.toLowerCase() === 'claude') return 'Claude';
      if (p.toLowerCase() === 'fable') return 'Fable';
      if (p.toLowerCase() === 'opus') return 'Opus';
      if (p.toLowerCase() === 'sonnet') return 'Sonnet';
      if (p.toLowerCase() === 'haiku') return 'Haiku';
      if (/^\d+(\.\d+)?$/.test(p)) return p;
      if (/^\d{8}$/.test(p)) return `(${p})`;
      return p.charAt(0).toUpperCase() + p.slice(1);
    })
    .join(' ')
    .replace(' - ', ' ')
    .trim();
}

export function useLiveModels() {
  const [models, setModels] = useState<LiveModelItem[]>(DEFAULT_FALLBACK_MODELS);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchLiveModels = useCallback(async () => {
    setIsLoading(true);
    const domain = getApiDomain();
    const candidateEndpoints = [
      `${domain}/v1/models`,
      'https://api.opuszen.pro/v1/models',
      '/v1/models',
    ];

    let rawList: any[] | null = null;

    for (const url of candidateEndpoints) {
      try {
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!res.ok) continue;
        const json = await res.json();
        const data = Array.isArray(json) ? json : json.data;
        if (Array.isArray(data) && data.length > 0) {
          rawList = data;
          break;
        }
      } catch {
        // Continue to next endpoint candidate
      }
    }

    if (rawList && rawList.length > 0) {
      const parsed: LiveModelItem[] = rawList.map((item: any) => {
        const id: string = typeof item === 'string' ? item : item.id || '';
        const known = KNOWN_METADATA[id] || {};
        const is1M = id.includes('[1m]') || item.context_window === 1000000;
        const displayName = item.display_name || known.name || formatModelName(id);

        let cutoff = known.cutoff || 'Active';
        if (item.created_at) {
          const d = new Date(item.created_at);
          if (!isNaN(d.getTime())) {
            cutoff = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }
        }

        const isFlagship =
          known.tier === 'flagship' ||
          id.includes('fable-5-2') ||
          id.includes('sonnet-5-5') ||
          id.includes('opus-5-5') ||
          id.includes('haiku-5-5') ||
          id.includes('fable-5-1') ||
          id.includes('3-7-sonnet');

        return {
          id,
          name: displayName,
          context: known.context || (is1M ? '1M context' : '200K context'),
          badge: known.badge || (id.includes('5-2') || id.includes('5-5') ? 'New Live' : undefined),
          description:
            known.description ||
            `Anthropic Claude model (${id}) with real-time pass-through streaming and sub-20ms latency.`,
          cutoff,
          tier: isFlagship ? 'flagship' : 'standard',
          createdAt: item.created_at,
          isNew: id.includes('5-2') || id.includes('5-5'),
        };
      });

      // Filter out raw [1m] duplicates from the main cards to keep view crisp, but keep them accessible
      const deduplicatedBase = parsed.filter((m) => !m.id.endsWith('[1m]'));
      setModels(deduplicatedBase.length > 0 ? deduplicatedBase : parsed);
      setIsLive(true);
      setLastUpdated(new Date().toLocaleTimeString());
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchLiveModels();

    // Auto-update every 60 seconds so site stays synchronized with provider updates
    const interval = setInterval(fetchLiveModels, 60000);
    return () => clearInterval(interval);
  }, [fetchLiveModels]);

  const flagshipModels = useMemo(() => {
    const flagships = models.filter((m) => m.tier === 'flagship');
    return flagships.length > 0 ? flagships : models.slice(0, 6);
  }, [models]);

  const supportingModels = useMemo(() => {
    return models.filter((m) => m.tier !== 'flagship');
  }, [models]);

  const modelIds = useMemo(() => {
    return models.map((m) => m.id);
  }, [models]);

  return {
    models,
    flagshipModels,
    supportingModels,
    modelIds,
    totalCount: models.length,
    isLive,
    isLoading,
    lastUpdated,
    refresh: fetchLiveModels,
  };
}
