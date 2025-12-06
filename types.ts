
export interface NavItem {
  label: string;
  id: string;
}

export enum TabView {
  EDITOR = 'EDITOR',
  MEME = 'MEME',
  PROFILE = 'PROFILE',
  REWRITE = 'REWRITE',
  PROMPT_GEN = 'PROMPT_GEN'
}

export type Language = 'EN' | 'VI' | 'ZH' | 'RU';

export interface GeneratedImageResult {
  imageUrl: string | null;
  error: string | null;
}

export interface HistoryItem {
  id: string;
  thumbnail?: string; // Image result
  textPreview?: string; // Text result (for rewrite/profile)
  prompt: string;
  timestamp: number;
  type: TabView;
}

// Prompt Builder Types
export type PromptCategory = 'CHAT' | 'CONTENT' | 'ART' | 'CODE' | 'LEARNING' | 'SOCIAL';

export interface PromptBuilderState {
  category: PromptCategory;
  goal: string;
  audience: string;
  tone: string;
  length: string;
  language: string;
  format: string;
  // Art specific
  style: string;
  lighting: string;
  // Code specific
  techStack: string;
  // Social specific
  platform: string;
}