import type { BYOKConfig, Analysis, Chat, Report } from "@/types";

const KEYS = {
  SETTINGS: "videogpt_settings",
  ANALYSES: "videogpt_analyses",
  CHATS: "videogpt_chats",
  REPORTS: "videogpt_reports",
} as const;

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

// === Settings ===

export function getSettings(): BYOKConfig | null {
  return getItem<BYOKConfig | null>(KEYS.SETTINGS, null);
}

export function saveSettings(settings: BYOKConfig): void {
  setItem(KEYS.SETTINGS, settings);
}

// === Storage pruning ===

const PRUNE_LIMITS = { analyses: 50, chats: 50, reports: 50 } as const;
const PRUNE_KEEP = { analyses: 40, chats: 40, reports: 20 } as const;

export function pruneStorage(): void {
  // Prune analyses
  const analyses = getAnalyses();
  if (analyses.length > PRUNE_LIMITS.analyses) {
    setItem(KEYS.ANALYSES, analyses.slice(0, PRUNE_KEEP.analyses));
  }

  // Prune chats (stored as a Record keyed by analysisId)
  const chats = getItem<Record<string, Chat>>(KEYS.CHATS, {});
  const chatKeys = Object.keys(chats);
  if (chatKeys.length > PRUNE_LIMITS.chats) {
    const keysToKeep = chatKeys.slice(0, PRUNE_KEEP.chats);
    const prunedChats: Record<string, Chat> = {};
    for (const key of keysToKeep) {
      prunedChats[key] = chats[key];
    }
    setItem(KEYS.CHATS, prunedChats);
  }

  // Prune reports
  const reports = getReports();
  if (reports.length > PRUNE_LIMITS.reports) {
    setItem(KEYS.REPORTS, reports.slice(0, PRUNE_KEEP.reports));
  }
}

// === Analyses ===

export function getAnalyses(): Analysis[] {
  return getItem<Analysis[]>(KEYS.ANALYSES, []);
}

export function saveAnalysis(analysis: Analysis): void {
  const analyses = getAnalyses().filter((a) => a.id !== analysis.id);
  analyses.unshift(analysis);
  setItem(KEYS.ANALYSES, analyses);
  pruneStorage();
}

export function getAnalysis(id: string): Analysis | null {
  return getAnalyses().find((a) => a.id === id) ?? null;
}

export function deleteAnalysis(id: string): void {
  const analyses = getAnalyses().filter((a) => a.id !== id);
  setItem(KEYS.ANALYSES, analyses);
}

// === Chats ===

export function getChat(analysisId: string): Chat | null {
  const chats = getItem<Record<string, Chat>>(KEYS.CHATS, {});
  return chats[analysisId] ?? null;
}

export function saveChat(chat: Chat): void {
  const chats = getItem<Record<string, Chat>>(KEYS.CHATS, {});
  chats[chat.analysisId] = chat;
  setItem(KEYS.CHATS, chats);
  pruneStorage();
}

// === Reports ===

export function getReports(): Report[] {
  return getItem<Report[]>(KEYS.REPORTS, []);
}

export function saveReport(report: Report): void {
  const reports = getReports().filter((r) => r.id !== report.id);
  reports.unshift(report);
  setItem(KEYS.REPORTS, reports);
  pruneStorage();
}

export function getReport(id: string): Report | null {
  return getReports().find((r) => r.id === id) ?? null;
}
