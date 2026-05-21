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

// === Analyses ===

export function getAnalyses(): Analysis[] {
  return getItem<Analysis[]>(KEYS.ANALYSES, []);
}

export function saveAnalysis(analysis: Analysis): void {
  const analyses = getAnalyses().filter((a) => a.id !== analysis.id);
  analyses.unshift(analysis);
  setItem(KEYS.ANALYSES, analyses);
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
}

// === Reports ===

export function getReports(): Report[] {
  return getItem<Report[]>(KEYS.REPORTS, []);
}

export function saveReport(report: Report): void {
  const reports = getReports().filter((r) => r.id !== report.id);
  reports.unshift(report);
  setItem(KEYS.REPORTS, reports);
}

export function getReport(id: string): Report | null {
  return getReports().find((r) => r.id === id) ?? null;
}
