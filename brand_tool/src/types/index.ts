export interface BrandProfile {
  url: string;
  name: string;
  location: string;
  language: string;
  description: string;
  industry: string;
  identity: string[];       // brand identity tags
  products: string[];       // products & services
  audience: {
    simple: number;
    informed: number;
    evaluative: number;
  };
  crawledPages: CrawledPage[];
}

export interface CrawledPage {
  url: string;
  title: string;
  content: string;
}

export interface Topic {
  id: string;
  name: string;
  selected: boolean;
}

export interface Prompt {
  id: string;
  topicId: string;
  topicName: string;
  text: string;
  selected: boolean;
}

export interface VisibilityResult {
  promptId: string;
  promptText: string;
  topicName: string;
  aiResponse: string;
  mentioned: boolean;
  mentionCount: number;
  positionRank: number | null;   // 1 = first brand mentioned
  sentiment: number;             // -1 to +1
  sentimentLabel: "positive" | "neutral" | "negative";
  competitors: CompetitorMention[];
}

export interface CompetitorMention {
  name: string;
  positionRank: number;
  sentiment: number;
}

export interface BrandStats {
  brand: string;
  isOwn: boolean;
  visibility: number;        // 0–100 %
  avgPosition: number;
  avgSentiment: number;
  sentimentLabel: string;
  mentionCount: number;
}

export interface SetupState {
  step: number;
  profile: BrandProfile | null;
  topics: Topic[];
  prompts: Prompt[];
  results: VisibilityResult[];
  brandStats: BrandStats[];
  analysisComplete: boolean;
}
