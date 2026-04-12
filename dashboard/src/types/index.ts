export interface BrandSummary {
  brand: string;
  total_prompts: number;
  mentioned_in: number;
  mention_rate: number;   // 0–100
  avg_position: number;   // 0–1
  avg_sentiment: number;  // -1 to +1
  total_mentions: number;
}

export interface ScorePoint {
  date: string;
  total_prompts: number;
  mentioned: number;
  mention_rate: number;
  avg_position: number;
  avg_sentiment: number;
}

export interface PromptRow {
  prompt_id: string;
  category: string;
  prompt_text: string;
  model: string;
  collected_at: string;
  mentioned: boolean;
  mention_count: number;
  position_score: number;
  avg_sentiment: number;
  sentiment_label: "positive" | "neutral" | "negative";
}

export interface CompetitorData {
  [brand: string]: {
    [category: string]: {
      total: number;
      mentioned: number;
      mention_rate: number;
      avg_position: number;
      avg_sentiment: number;
    };
  };
}

export interface Run {
  run_id: string;
  started_at: string;
  finished_at: string;
  response_count: number;
  avg_latency_ms: number;
}

export interface Suggestion {
  prompt_text: string;
  category: string;
  suggestion: string;
}
