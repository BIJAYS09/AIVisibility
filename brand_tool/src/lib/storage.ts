import type { SetupState, BrandProfile, Topic, Prompt, VisibilityResult, BrandStats } from "@/types";

const KEY = "peec_setup";

export function getState(): SetupState {
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : defaultState();
  } catch {
    return defaultState();
  }
}

export function setState(partial: Partial<SetupState>) {
  const current = getState();
  const next = { ...current, ...partial };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearState() {
  localStorage.removeItem(KEY);
}

function defaultState(): SetupState {
  return {
    step: 1,
    profile: null,
    topics: [],
    prompts: [],
    results: [],
    brandStats: [],
    analysisComplete: false,
  };
}

// Typed helpers
export const storage = {
  getProfile:    (): BrandProfile | null => getState().profile,
  setProfile:    (p: BrandProfile) => setState({ profile: p }),
  getTopics:     (): Topic[] => getState().topics,
  setTopics:     (t: Topic[]) => setState({ topics: t }),
  getPrompts:    (): Prompt[] => getState().prompts,
  setPrompts:    (p: Prompt[]) => setState({ prompts: p }),
  getResults:    (): VisibilityResult[] => getState().results,
  getBrandStats: (): BrandStats[] => getState().brandStats,
  isComplete:    (): boolean => getState().analysisComplete,
  clearState:    () => clearState(),
  setResults: (r: VisibilityResult[], stats: BrandStats[]) =>
    setState({ results: r, brandStats: stats, analysisComplete: true }),
};
