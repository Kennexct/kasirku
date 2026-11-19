import { lang } from '../i18n';
import { HELP_EN } from './help.en';
import { HELP_ID } from './help.id';

/** Help centre content (ADR-009): typed data bundled with the app so it works offline. */
export const HELP_TOPIC_IDS = [
  'jual', 'varian', 'diskon', 'simpan', 'qris', 'struk', 'riwayat', 'laporan', 'kas', 'produk', 'timbang', 'pelanggan', 'staf', 'offline', 'cadangan', 'pasang',
] as const;
export type HelpTopicId = (typeof HELP_TOPIC_IDS)[number];

export interface HelpTopicBody {
  title: string;
  /** One or two sentences: what this is for. */
  summary: string;
  /** How to do it, in order. */
  steps: readonly string[];
  /** Things worth knowing. */
  notes: readonly string[];
  /** Extra words people search for. */
  keywords: string;
}
export interface HelpTopic extends HelpTopicBody {
  id: HelpTopicId;
}

export interface IntroCard {
  title: string;
  body: string;
}

export interface HelpContent {
  topics: Record<HelpTopicId, HelpTopicBody>;
  /** The four "how it works" cards shown at the end of the first-time journey. */
  intro: readonly IntroCard[];
}

const content: HelpContent = lang === 'en' ? HELP_EN : HELP_ID;

export const INTRO_CARDS = content.intro;
export const HELP_TOPICS: readonly HelpTopic[] = HELP_TOPIC_IDS.map((id) => ({ id, ...content.topics[id] }));
export const helpTopic = (id: HelpTopicId): HelpTopic => ({ id, ...content.topics[id] });

/** Case-insensitive search over title, summary, keywords, steps and notes. Empty query = everything. */
export function searchHelp(query: string, topics: readonly HelpTopic[] = HELP_TOPICS): HelpTopic[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...topics];
  return topics.filter((topic) => {
    const haystack = [topic.title, topic.summary, topic.keywords, ...topic.steps, ...topic.notes].join(' ').toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
