// ============ Video Sources ============

export type VideoSourceType = "youtube" | "vimeo" | "loom" | "mp4" | "file";

export interface VideoSource {
  type: VideoSourceType;
  url?: string;
  title?: string;
  thumbnailUrl?: string;
  duration?: number; // seconds
}

// ============ BYOK Provider ============

export const AI_PROVIDERS = [
  "OpenAI",
  "Anthropic",
  "Gemini",
  "OpenRouter",
  "Groq",
  "DeepSeek",
  "Ollama",
  "LM Studio",
] as const;

export type AIProvider = (typeof AI_PROVIDERS)[number];

export const PROVIDER_DEFAULTS: Record<
  AIProvider,
  { baseUrl: string; defaultModel: string }
> = {
  OpenAI: {
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
  },
  Anthropic: {
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4-20250514",
  },
  Gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    defaultModel: "gemini-2.0-flash",
  },
  OpenRouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o",
  },
  Groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
  },
  DeepSeek: {
    baseUrl: "https://api.deepseek.com",
    defaultModel: "deepseek-chat",
  },
  Ollama: {
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3",
  },
  "LM Studio": {
    baseUrl: "http://localhost:1234/v1",
    defaultModel: "local-model",
  },
};

export interface BYOKConfig {
  provider: AIProvider;
  baseUrl: string;
  apiKey: string;
  model: string;
}

// ============ Transcript ============

export interface TranscriptSegment {
  start: number; // seconds
  end: number;
  text: string;
}

export interface Transcript {
  source: VideoSource;
  segments: TranscriptSegment[];
  fullText: string;
}

// ============ Analysis (Rich Structured Model) ============

export interface VideoMetadata {
  title: string;
  duration: string;
  main_topics: string[];
  overall_theme: string;
  audience_type: string;
  tone: string;
}

export interface MainPoint {
  title: string;
  description: string;
  importance: string;
}

export interface DiscussedIdea {
  title: string;
  category: string;
  description: string;
  practical_implication: string;
}

export interface ImplementationIdea {
  title: string;
  description: string;
  implementation_steps: string[];
}

export interface BusinessInsight {
  title: string;
  description: string;
}

export interface EducationalConcept {
  title: string;
  description: string;
}

export interface WeakClaim {
  claim: string;
  reason: string;
}

export interface Quote {
  quote: string;
  meaning: string;
}

export interface TimelineItem {
  timestamp: string;
  topic: string;
}

export interface Analysis {
  id: string;
  videoSource: VideoSource;
  transcript: Transcript;
  // Rich structured fields from the comprehensive analysis
  video_metadata: VideoMetadata;
  executive_summary: string;
  main_points: MainPoint[];
  ideas_discussed: DiscussedIdea[];
  implementation_ideas: ImplementationIdea[];
  business_insights: BusinessInsight[];
  educational_concepts: EducationalConcept[];
  warnings_or_weak_claims: WeakClaim[];
  quotes: Quote[];
  timeline_breakdown: TimelineItem[];
  final_takeaway: string;
  createdAt: number; // timestamp
}

// ============ Chat ============

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export interface Chat {
  analysisId: string;
  messages: ChatMessage[];
}

// ============ Reports ============

export interface Report {
  id: string;
  analysisId: string;
  title: string;
  html: string;
  createdAt: number;
}

// ============ App State ============

export interface AppState {
  currentAnalysis: Analysis | null;
  analyses: Analysis[];
  chats: Record<string, Chat>;
  reports: Report[];
  settings: BYOKConfig | null;
  isAnalyzing: boolean;
  analysisProgress: string;
}
