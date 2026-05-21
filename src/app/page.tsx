"use client";

import { useState } from "react";
import Link from "next/link";
import VideoInput from "@/components/VideoInput";
import { useApp } from "@/lib/providers";
import { formatTimestamp } from "@/lib/utils";

export default function HomePage() {
  const { analyses, currentAnalysis, isAnalyzing, settings } = useApp();
  const [showInput, setShowInput] = useState(true);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/3 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-24">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-6">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              BYOK — Bring Your Own Key
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
              <span className="gradient-text">Video Intelligence</span>
              <br />
              <span className="text-white">for Everyone</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Transform YouTube and video content into structured, actionable intelligence.
              Analyze, chat, and generate premium reports — all powered by your own AI key.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {[
                ["🎬", "YouTube & Vimeo"],
                ["🧠", "AI Deep Analysis"],
                ["💬", "Chat with Videos"],
                ["📄", "HTML Reports"],
                ["🔑", "BYOK Provider"],
              ].map(([icon, label]) => (
                <div
                  key={label}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-sm text-gray-300 flex items-center gap-2"
                >
                  <span>{icon}</span>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Video Input */}
          <VideoInput onAnalysisStart={() => setShowInput(true)} />
        </div>
      </div>

      {/* Settings CTA */}
      {!settings && (
        <div className="max-w-6xl mx-auto px-4 mb-12">
          <div className="glass rounded-2xl p-6 border border-amber-500/20 text-center">
            <p className="text-amber-300 text-sm mb-3">
              ⚡ Configure your AI provider to get started
            </p>
            <Link
              href="/settings"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium hover:from-amber-500 hover:to-orange-500 transition-all inline-flex items-center gap-2 text-sm"
            >
              <span>🔑</span>
              Add API Key
            </Link>
          </div>
        </div>
      )}

      {/* Current Analysis Preview */}
      {currentAnalysis && !isAnalyzing && (
        <div className="max-w-6xl mx-auto px-4 pb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span>📊</span>
              Latest Analysis
            </h2>
            <Link
              href={`/analyze/${currentAnalysis.id}`}
              className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm flex items-center gap-2"
            >
              View Full Analysis →
            </Link>
          </div>

          {/* Executive Summary */}
          <div className="glass rounded-2xl p-8 border border-white/5 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📊</span> Executive Summary
            </h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {currentAnalysis.executive_summary}
            </p>
            {currentAnalysis.final_takeaway && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-sm text-gray-400 mb-1">🏁 Final Takeaway</p>
                <p className="text-blue-200 font-medium">{currentAnalysis.final_takeaway}</p>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{currentAnalysis.main_points?.length ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Main Points</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{currentAnalysis.ideas_discussed?.length ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Ideas</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{currentAnalysis.implementation_ideas?.length ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Action Plans</p>
            </div>
            <div className="glass rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{currentAnalysis.timeline_breakdown?.length ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Segments</p>
            </div>
          </div>

          {/* Top main points preview */}
          {(currentAnalysis.main_points?.length ?? 0) > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentAnalysis.main_points!.slice(0, 3).map((point, i) => (
                <div
                  key={i}
                  className="glass rounded-xl p-5 border-l-4 border-blue-500/40 hover:border-blue-500/60 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                      {point.importance}
                    </span>
                  </div>
                  <h4 className="font-semibold text-white text-sm mb-1">{point.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{point.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {analyses.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pb-24">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <span>📚</span>
            Analysis History
          </h2>
          <div className="grid gap-3">
            {analyses.map((a) => (
              <Link
                key={a.id}
                href={`/analyze/${a.id}`}
                className="glass rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                    🎬
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-white truncate">
                      {a.videoSource.title ?? "Untitled"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {a.videoSource.type} &middot;{" "}
                      {a.transcript.segments.length} segments &middot;{" "}
                      {a.main_points?.length ?? 0} points &middot;{" "}
                      {formatTimestamp(a.createdAt)}
                    </p>
                  </div>
                </div>
                <span className="text-gray-500 group-hover:text-gray-300 transition-colors text-sm">
                  View →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Built with ❤️ — VideoGPT AI Video Intelligence Platform
          </p>
          <p className="text-gray-700 text-xs mt-1">
            BYOK (Bring Your Own Key) &middot; Your API key never touches our servers
          </p>
        </div>
      </footer>
    </div>
  );
}
