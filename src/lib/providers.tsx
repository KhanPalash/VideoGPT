"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type {
  AppState,
  Analysis,
  BYOKConfig,
  Chat,
  ChatMessage,
  Report,
  VideoSource,
} from "@/types";
import { generateId } from "./utils";
import { getSettings, saveSettings, getAnalysis, saveAnalysis, getAnalyses, getChat, saveChat, getReports, saveReport, deleteAnalysis as deleteStoredAnalysis } from "./storage";
import { extractTranscript } from "./transcript";
import { analyzeVideo } from "./analysis";
import { AIClient } from "./ai";

interface AppContextType extends AppState {
  setSettings: (settings: BYOKConfig) => void;
  startAnalysis: (source: VideoSource) => Promise<Analysis | null>;
  sendChatMessage: (content: string) => Promise<void>;
  generateReport: () => Promise<Report | null>;
  loadAnalysis: (id: string) => void;
  loadAnalyses: () => void;
  deleteAnalysis: (id: string) => void;
  clearChat: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    currentAnalysis: null,
    analyses: [],
    chats: {},
    reports: [],
    settings: null,
    isAnalyzing: false,
    analysisProgress: "",
  });

  // Load persisted data on mount
  useEffect(() => {
    const settings = getSettings();
    const analyses = getAnalyses();
    const reports = getReports();
    setState((s) => ({ ...s, settings, analyses, reports }));
  }, []);

  const setSettings = useCallback((settings: BYOKConfig) => {
    saveSettings(settings);
    setState((s) => ({ ...s, settings }));
  }, []);

  const startAnalysis = useCallback(
    async (source: VideoSource): Promise<Analysis | null> => {
      const settings = getSettings();
      if (!settings) {
        alert("Please configure your AI provider settings first.");
        return null;
      }

      setState((s) => ({ ...s, isAnalyzing: true, analysisProgress: "Extracting transcript..." }));

      try {
        const transcript = await extractTranscript(source);
        setState((s) => ({ ...s, analysisProgress: "Running AI deep analysis..." }));

        const analysis = await analyzeVideo(
          source,
          transcript,
          settings,
          (progress) => {
            setState((s) => ({ ...s, analysisProgress: progress }));
          }
        );

        saveAnalysis(analysis);
        setState((s) => ({
          ...s,
          currentAnalysis: analysis,
          analyses: [analysis, ...s.analyses],
          chats: {
            ...s.chats,
            [analysis.id]: { analysisId: analysis.id, messages: [] },
          },
          isAnalyzing: false,
          analysisProgress: "",
        }));

        return analysis;
      } catch (error) {
        console.error("Analysis failed:", error);
        setState((s) => ({
          ...s,
          isAnalyzing: false,
          analysisProgress: `Error: ${error instanceof Error ? error.message : "Analysis failed"}`,
        }));
        return null;
      }
    },
    []
  );

  const sendChatMessage = useCallback(
    async (content: string) => {
      const settings = getSettings();
      const analysis = state.currentAnalysis;
      if (!settings || !analysis) return;

      const chat = getChat(analysis.id) ?? {
        analysisId: analysis.id,
        messages: [],
      };

      const userMessage: ChatMessage = {
        id: generateId(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      const updatedMessages = [...chat.messages, userMessage];
      const updatedChat = { ...chat, messages: updatedMessages };
      saveChat(updatedChat);

      setState((s) => ({
        ...s,
        chats: { ...s.chats, [analysis.id]: updatedChat },
      }));

      try {
        const ai = new AIClient(settings);

        // Build rich context from the new analysis structure
        const pointsText = analysis.main_points
          .map((p) => `- ${p.title} (Importance: ${p.importance}): ${p.description}`)
          .join("\n");
        const ideasText = analysis.ideas_discussed
          .map((i) => `- ${i.title} [${i.category}]: ${i.description}`)
          .join("\n");
        const implText = analysis.implementation_ideas
          .map((im) => `- ${im.title}: ${im.description}\n  Steps: ${im.implementation_steps.join(", ")}`)
          .join("\n");
        const bizText = analysis.business_insights
          .map((b) => `- ${b.title}: ${b.description}`)
          .join("\n");
        const educText = analysis.educational_concepts
          .map((e) => `- ${e.title}: ${e.description}`)
          .join("\n");
        const warningText = analysis.warnings_or_weak_claims
          .map((w) => `- Claim: ${w.claim} | Reason: ${w.reason}`)
          .join("\n");
        const quoteText = analysis.quotes
          .map((q) => `- "${q.quote}" — Meaning: ${q.meaning}`)
          .join("\n");
        const timelineText = analysis.timeline_breakdown
          .map((t) => `- ${t.timestamp}: ${t.topic}`)
          .join("\n");

        const systemPrompt = `You are an elite AI Video Intelligence Agent analyzing a video. Here is the full transcript and structured analysis.

VIDEO TITLE: ${analysis.videoSource.title ?? "Untitled"}
VIDEO TYPE: ${analysis.videoSource.type}
THEME: ${analysis.video_metadata.overall_theme}
AUDIENCE: ${analysis.video_metadata.audience_type}
TONE: ${analysis.video_metadata.tone}
MAIN TOPICS: ${analysis.video_metadata.main_topics.join(", ")}

TRANSCRIPT:
${analysis.transcript.fullText.slice(0, 30000)}

EXECUTIVE SUMMARY:
${analysis.executive_summary}

MAIN POINTS:
${pointsText}

IDEAS DISCUSSED:
${ideasText}

IMPLEMENTATION IDEAS:
${implText}

BUSINESS INSIGHTS:
${bizText}

EDUCATIONAL CONCEPTS:
${educText}

WARNINGS / WEAK CLAIMS:
${warningText}

KEY QUOTES:
${quoteText}

TIMELINE:
${timelineText}

FINAL TAKEAWAY:
${analysis.final_takeaway}

You have FULL context of this video. Answer the user's questions based on this video content. Be thorough, specific, analytical, and reference timestamps when possible. If the answer isn't in the video content, say so clearly.`;

        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: "",
          timestamp: Date.now(),
        };

        const messagesWithNew = [...updatedMessages, assistantMessage];
        const currentMessages = messagesWithNew.slice(0, -1);

        // Add placeholder
        setState((s) => ({
          ...s,
          chats: {
            ...s.chats,
            [analysis.id]: {
              ...updatedChat,
              messages: messagesWithNew,
            },
          },
        }));

        let fullResponse = "";
        const chatMessages = [
          { role: "system" as const, content: systemPrompt },
          ...currentMessages
            .filter((m) => m.role !== "system")
            .slice(-20)
            .map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
        ];

        try {
          const stream = ai.streamChat(chatMessages, { temperature: 0.7 });
          for await (const chunk of stream) {
            fullResponse += chunk;
            setState((s) => ({
              ...s,
              chats: {
                ...s.chats,
                [analysis.id]: {
                  ...updatedChat,
                  messages: [
                    ...currentMessages,
                    { ...assistantMessage, content: fullResponse },
                  ],
                },
              },
            }));
          }
        } catch (streamError) {
          console.warn("Streaming failed, falling back to non-streaming:", streamError);
          try {
            fullResponse = await ai.chat(chatMessages, { temperature: 0.7 });
          } catch (chatError) {
            console.error("Non-streaming chat also failed:", chatError);
            throw new Error(
              `Chat failed. ${chatError instanceof Error ? chatError.message : "Unknown error"}. ` +
              "Please check your API provider settings."
            );
          }
        }

        if (!fullResponse) {
          fullResponse = "I received your message but couldn't generate a response. The API returned an empty result. Please check your provider and model settings.";
        }

        const finalMessage: ChatMessage = {
          ...assistantMessage,
          content: fullResponse,
        };

        const finalMessages = [...currentMessages, finalMessage];
        const finalChat = { ...chat, messages: finalMessages };
        saveChat(finalChat);

        setState((s) => ({
          ...s,
          chats: { ...s.chats, [analysis.id]: finalChat },
        }));
      } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. Please check your API key and try again.`,
          timestamp: Date.now(),
        };
        const errorMessages = [...updatedMessages, errorMessage];
        const errorChat = { ...chat, messages: errorMessages };
        saveChat(errorChat);
        setState((s) => ({
          ...s,
          chats: { ...s.chats, [analysis.id]: errorChat },
        }));
      }
    },
    [state.currentAnalysis]
  );

  const generateReport = useCallback(async (): Promise<Report | null> => {
    const analysis = state.currentAnalysis;
    if (!analysis) return null;

    const id = generateId();
    const html = generateReportHTML(analysis);

    const report: Report = {
      id,
      analysisId: analysis.id,
      title: `${analysis.videoSource.title ?? "Video"} Report`,
      html,
      createdAt: Date.now(),
    };

    saveReport(report);
    setState((s) => ({ ...s, reports: [report, ...s.reports] }));
    return report;
  }, [state.currentAnalysis]);

  const loadAnalysis = useCallback((id: string) => {
    const analysis = getAnalysis(id);
    if (analysis) {
      const chat = getChat(id);
      setState((s) => ({
        ...s,
        currentAnalysis: analysis,
        chats: {
          ...s.chats,
          ...(chat ? { [id]: chat } : {}),
        },
      }));
    }
  }, []);

  const loadAnalyses = useCallback(() => {
    setState((s) => ({ ...s, analyses: getAnalyses() }));
  }, []);

  const deleteAnalysis = useCallback((id: string) => {
    deleteStoredAnalysis(id);
    setState((s) => ({
      ...s,
      analyses: s.analyses.filter((a) => a.id !== id),
      currentAnalysis: s.currentAnalysis?.id === id ? null : s.currentAnalysis,
      reports: s.reports.filter((r) => r.analysisId !== id),
    }));
  }, []);

  const clearChat = useCallback(() => {
    const analysis = state.currentAnalysis;
    if (!analysis) return;
    const emptyChat: Chat = { analysisId: analysis.id, messages: [] };
    saveChat(emptyChat);
    setState((s) => ({
      ...s,
      chats: { ...s.chats, [analysis.id]: emptyChat },
    }));
  }, [state.currentAnalysis]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setSettings,
        startAnalysis,
        sendChatMessage,
        generateReport,
        loadAnalysis,
        loadAnalyses,
        deleteAnalysis,
        clearChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

function generateReportHTML(analysis: Analysis): string {
  const pointsHtml = analysis.main_points
    .map(
      (p, i) => `
    <div class="insight-card glass rounded-xl p-6 border-l-4" style="border-left-color: #3b82f6; animation-delay: ${0.2 + i * 0.05}s">
      <div class="flex items-start gap-4">
        <span class="text-2xl flex-shrink-0 mt-0.5">💡</span>
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h3 class="font-semibold text-lg">${p.title}</h3>
            <span class="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">${p.importance}</span>
          </div>
          <p class="text-gray-400 leading-relaxed">${p.description}</p>
        </div>
      </div>
    </div>`
    )
    .join("\n");

  const ideasHtml = analysis.ideas_discussed
    .map(
      (idea, i) => `
    <div class="insight-card glass rounded-xl p-5 border border-white/5" style="animation-delay: ${0.3 + i * 0.05}s">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">${idea.category}</span>
      </div>
      <h4 class="font-semibold text-white text-sm mb-1">${idea.title}</h4>
      <p class="text-gray-400 text-sm">${idea.description}</p>
      ${idea.practical_implication ? `<p class="text-gray-500 text-xs mt-2">💡 ${idea.practical_implication}</p>` : ""}
    </div>`
    )
    .join("\n");

  const implHtml = analysis.implementation_ideas
    .map(
      (im, i) => `
    <div class="glass rounded-xl p-5 border-l-4" style="border-left-color: #10b981; animation-delay: ${0.4 + i * 0.05}s">
      <h4 class="font-semibold text-white text-sm mb-2">${im.title}</h4>
      <p class="text-gray-400 text-sm mb-3">${im.description}</p>
      ${im.implementation_steps.length > 0 ? `
      <ol class="space-y-1.5">
        ${im.implementation_steps.map((step, si) => `
          <li class="flex items-start gap-2 text-gray-500 text-xs">
            <span class="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">${si + 1}</span>
            ${step}
          </li>`).join("\n")}
      </ol>` : ""}
    </div>`
    )
    .join("\n");

  const bizHtml = analysis.business_insights
    .map(
      (b, i) => `
    <div class="glass rounded-xl p-4 border-l-4" style="border-left-color: #f59e0b; animation-delay: ${0.5 + i * 0.05}s">
      <h4 class="font-semibold text-white text-sm mb-1">${b.title}</h4>
      <p class="text-gray-400 text-xs">${b.description}</p>
    </div>`
    )
    .join("\n");

  const educHtml = analysis.educational_concepts
    .map(
      (e, i) => `
    <div class="glass rounded-xl p-4 border-l-4" style="border-left-color: #06b6d4; animation-delay: ${0.6 + i * 0.05}s">
      <h4 class="font-semibold text-white text-sm mb-1">${e.title}</h4>
      <p class="text-gray-400 text-xs">${e.description}</p>
    </div>`
    )
    .join("\n");

  const warningHtml = analysis.warnings_or_weak_claims
    .map(
      (w, i) => `
    <div class="glass rounded-xl p-4 border border-red-500/20" style="animation-delay: ${0.7 + i * 0.05}s">
      <p class="text-red-400 text-xs font-medium mb-1">⚠ ${w.claim}</p>
      <p class="text-gray-500 text-xs">${w.reason}</p>
    </div>`
    )
    .join("\n");

  const quoteHtml = analysis.quotes
    .map(
      (q, i) => `
    <div class="glass rounded-xl p-5 border-l-4" style="border-left-color: #f472b6; animation-delay: ${0.8 + i * 0.05}s">
      <p class="text-gray-200 text-sm italic leading-relaxed mb-2">"${q.quote}"</p>
      <p class="text-gray-500 text-xs">— ${q.meaning}</p>
    </div>`
    )
    .join("\n");

  const timelineHtml = analysis.timeline_breakdown
    .map(
      (t, i) => `
    <div class="flex gap-4 pb-4">
      <div class="flex flex-col items-center">
        <div class="timeline-dot w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg shadow-blue-500/20 flex-shrink-0"></div>
        ${i < analysis.timeline_breakdown.length - 1 ? '<div class="w-0.5 flex-1 bg-gradient-to-b from-blue-500/30 to-purple-500/30 mt-1"></div>' : ""}
      </div>
      <div class="flex-1">
        <span class="text-xs font-mono text-gray-500">${t.timestamp}</span>
        <p class="text-gray-300 text-sm">${t.topic}</p>
      </div>
    </div>`
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${analysis.videoSource.title ?? "Video Analysis"} - VideoGPT Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { font-family: 'Inter', sans-serif; }
    body { background: #0a0a0f; }
    .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.06); }
    .gradient-text {
      background: linear-gradient(135deg, #60a5fa, #a78bfa, #f472b6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .insight-card { transition: all 0.3s ease; }
    .insight-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
    .timeline-dot { transition: all 0.3s ease; }
    .timeline-dot:hover { transform: scale(1.5); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
  </style>
</head>
<body class="min-h-screen text-gray-100">
  <div class="max-w-5xl mx-auto px-4 py-12">
    <!-- Header -->
    <div class="text-center mb-16 animate-in">
      <div class="inline-flex items-center gap-2 px-4 py-2 glass rounded-full mb-6">
        <span class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
        <span class="text-sm text-gray-400">AI-Powered Video Intelligence</span>
      </div>
      <h1 class="text-4xl md:text-6xl font-bold gradient-text mb-4">
        ${analysis.videoSource.title ?? "Video Analysis"}
      </h1>
      <div class="flex flex-wrap justify-center gap-3 text-sm text-gray-500">
        <span>${analysis.video_metadata.overall_theme ? `🎯 ${analysis.video_metadata.overall_theme}` : ""}</span>
        <span>${analysis.video_metadata.audience_type ? `👥 ${analysis.video_metadata.audience_type}` : ""}</span>
        <span>${analysis.video_metadata.tone ? `🎭 ${analysis.video_metadata.tone}` : ""}</span>
      </div>
      <p class="text-gray-400 text-sm mt-4">
        Generated by VideoGPT &middot; ${new Date(analysis.createdAt).toLocaleDateString()} &middot; ${analysis.transcript.segments.length} transcript segments
      </p>
    </div>

    <!-- Executive Summary -->
    ${analysis.executive_summary ? `
    <div class="glass rounded-2xl p-8 mb-8 animate-in" style="animation-delay: 0.1s">
      <h2 class="text-2xl font-semibold mb-6 flex items-center gap-3">
        <span class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-lg">📊</span>
        Executive Summary
      </h2>
      <div class="prose prose-invert max-w-none text-gray-300 leading-relaxed whitespace-pre-line">
        ${analysis.executive_summary}
      </div>
    </div>` : ""}

    <!-- Main Points -->
    ${analysis.main_points.length > 0 ? `
    <div class="mb-8 animate-in" style="animation-delay: 0.15s">
      <h2 class="text-2xl font-semibold mb-6 flex items-center gap-3">
        <span class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-lg">💡</span>
        Main Points
      </h2>
      <div class="grid gap-4">${pointsHtml}</div>
    </div>` : ""}

    <!-- Ideas Discussed -->
    ${analysis.ideas_discussed.length > 0 ? `
    <div class="mb-8 animate-in" style="animation-delay: 0.2s">
      <h2 class="text-2xl font-semibold mb-6 flex items-center gap-3">
        <span class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-lg">🧠</span>
        Ideas Discussed
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${ideasHtml}</div>
    </div>` : ""}

    <!-- Implementation Ideas -->
    ${analysis.implementation_ideas.length > 0 ? `
    <div class="mb-8 animate-in" style="animation-delay: 0.25s">
      <h2 class="text-2xl font-semibold mb-6 flex items-center gap-3">
        <span class="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-lg">🎯</span>
        Implementation Ideas
      </h2>
      <div class="grid gap-4">${implHtml}</div>
    </div>` : ""}

    <!-- Timeline -->
    ${analysis.timeline_breakdown.length > 0 ? `
    <div class="glass rounded-2xl p-8 mb-8 animate-in" style="animation-delay: 0.3s">
      <h2 class="text-2xl font-semibold mb-6 flex items-center gap-3">
        <span class="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-lg">📋</span>
        Timeline Breakdown
      </h2>
      <div>${timelineHtml}</div>
    </div>` : ""}

    <!-- Business Insights -->
    ${analysis.business_insights.length > 0 ? `
    <div class="mb-8 animate-in" style="animation-delay: 0.35s">
      <h2 class="text-2xl font-semibold mb-6 flex items-center gap-3">
        <span class="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">💼</span>
        Business Insights
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${bizHtml}</div>
    </div>` : ""}

    <!-- Educational Concepts -->
    ${analysis.educational_concepts.length > 0 ? `
    <div class="mb-8 animate-in" style="animation-delay: 0.4s">
      <h2 class="text-2xl font-semibold mb-6 flex items-center gap-3">
        <span class="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-lg">📚</span>
        Educational Concepts
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${educHtml}</div>
    </div>` : ""}

    <!-- Quotes -->
    ${analysis.quotes.length > 0 ? `
    <div class="mb-8 animate-in" style="animation-delay: 0.45s">
      <h2 class="text-2xl font-semibold mb-6 flex items-center gap-3">
        <span class="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-lg">💬</span>
        Key Quotes
      </h2>
      <div class="grid gap-4">${quoteHtml}</div>
    </div>` : ""}

    <!-- Warnings -->
    ${analysis.warnings_or_weak_claims.length > 0 ? `
    <div class="mb-8 animate-in" style="animation-delay: 0.5s">
      <h2 class="text-2xl font-semibold mb-6 flex items-center gap-3">
        <span class="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-lg">⚠️</span>
        Warnings & Weak Claims
      </h2>
      <div class="grid gap-3">${warningHtml}</div>
    </div>` : ""}

    <!-- Final Takeaway -->
    ${analysis.final_takeaway ? `
    <div class="glass rounded-2xl p-8 mb-8 animate-in border border-white/5" style="animation-delay: 0.55s">
      <h2 class="text-2xl font-semibold mb-4 flex items-center gap-3">
        <span class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg">🏁</span>
        Final Takeaway
      </h2>
      <p class="text-gray-200 text-lg leading-relaxed font-medium">${analysis.final_takeaway}</p>
    </div>` : ""}

    <!-- Footer -->
    <div class="text-center pt-8 animate-in" style="animation-delay: 0.6s">
      <p class="text-gray-600 text-sm">
        Generated with ❤️ by <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">VideoGPT</span>
      </p>
      <p class="text-gray-700 text-xs mt-1">
        AI-Powered Video Intelligence Platform &middot; BYOK (Bring Your Own Key)
      </p>
    </div>
  </div>
</body>
</html>`;
}
