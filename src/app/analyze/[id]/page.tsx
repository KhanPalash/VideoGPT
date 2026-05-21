"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/providers";
import { formatTimestamp, truncate } from "@/lib/utils";
import ChatBox from "@/components/ChatBox";
import ReportViewer from "@/components/ReportViewer";

export default function AnalysisPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentAnalysis, loadAnalysis } = useApp();

  useEffect(() => {
    if (id) loadAnalysis(id);
  }, [id, loadAnalysis]);

  if (!currentAnalysis) {
    return (
      <div className="text-center py-24 animate-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center text-3xl">
          🔍
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Analysis not found</h2>
        <p className="text-gray-400 mb-6">This analysis may have been deleted.</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all inline-flex items-center gap-2"
        >
          ← Back Home
        </Link>
      </div>
    );
  }

  const { video_metadata } = currentAnalysis;

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 mb-2"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {truncate(currentAnalysis.videoSource.title ?? "Untitled", 60)}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">
              {formatTimestamp(currentAnalysis.createdAt)} &middot;{" "}
              {currentAnalysis.videoSource.type} &middot;{" "}
              {currentAnalysis.transcript.segments.length} segments
            </span>
            {video_metadata?.audience_type && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                👥 {video_metadata.audience_type}
              </span>
            )}
            {video_metadata?.tone && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                🎭 {video_metadata.tone}
              </span>
            )}
          </div>
          {(video_metadata?.main_topics?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {video_metadata.main_topics.map((topic, i) => (
                <span
                  key={i}
                  className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/10"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      {currentAnalysis.executive_summary && (
        <div className="glass rounded-2xl p-8 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>📊</span> Executive Summary
          </h3>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">
            {currentAnalysis.executive_summary}
          </p>
        </div>
      )}

      {/* Chat + Main Points in two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChatBox />
        <div className="space-y-6">
          {(currentAnalysis.main_points?.length ?? 0) > 0 && (
            <>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>💡</span> Main Points
              </h3>
              <div className="space-y-3">
                {currentAnalysis.main_points!.map((point, i) => (
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
            </>
          )}
        </div>
      </div>

      {/* Ideas Discussed */}
      {(currentAnalysis.ideas_discussed?.length ?? 0) > 0 && (
        <div className="glass rounded-2xl p-8 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <span>🧠</span> Ideas Discussed
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentAnalysis.ideas_discussed!.map((idea, i) => (
              <div key={i} className="glass rounded-xl p-5 border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                    {idea.category}
                  </span>
                </div>
                <h4 className="font-semibold text-white text-sm mb-1">{idea.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{idea.description}</p>
                {idea.practical_implication && (
                  <p className="text-gray-500 text-xs mt-2 flex items-start gap-1">
                    <span>💡</span>
                    <span>{idea.practical_implication}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Implementation Ideas + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(currentAnalysis.implementation_ideas?.length ?? 0) > 0 && (
          <div className="glass rounded-2xl p-8 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span>🎯</span> Implementation Ideas
            </h3>
            <div className="space-y-4">
              {currentAnalysis.implementation_ideas!.map((impl, i) => (
                <div key={i} className="glass rounded-xl p-5 border-l-4 border-emerald-500/40">
                  <h4 className="font-semibold text-white text-sm mb-2">{impl.title}</h4>
                  <p className="text-gray-400 text-sm mb-3">{impl.description}</p>
                  {impl.implementation_steps.length > 0 && (
                    <ol className="space-y-1.5">
                      {impl.implementation_steps.map((step, si) => (
                        <li key={si} className="flex items-start gap-2 text-gray-500 text-xs">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0">
                            {si + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(currentAnalysis.timeline_breakdown?.length ?? 0) > 0 && (
          <div className="glass rounded-2xl p-8 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span>📋</span> Timeline Breakdown
            </h3>
            <div className="space-y-0">
              {currentAnalysis.timeline_breakdown!.map((item, i) => (
                <div key={i} className="flex gap-4 pb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex-shrink-0" />
                    {i < currentAnalysis.timeline_breakdown.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gradient-to-b from-blue-500/20 to-purple-500/20 mt-1" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-mono text-gray-500">{item.timestamp}</span>
                    <p className="text-gray-300 text-sm">{item.topic}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Business Insights + Educational Concepts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(currentAnalysis.business_insights?.length ?? 0) > 0 && (
          <div className="glass rounded-2xl p-8 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>💼</span> Business Insights
            </h3>
            <div className="space-y-3">
              {currentAnalysis.business_insights!.map((b, i) => (
                <div key={i} className="glass rounded-xl p-4 border-l-4 border-amber-500/40">
                  <h4 className="font-semibold text-white text-sm mb-1">{b.title}</h4>
                  <p className="text-gray-400 text-sm">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(currentAnalysis.educational_concepts?.length ?? 0) > 0 && (
          <div className="glass rounded-2xl p-8 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📚</span> Educational Concepts
            </h3>
            <div className="space-y-3">
              {currentAnalysis.educational_concepts!.map((e, i) => (
                <div key={i} className="glass rounded-xl p-4 border-l-4 border-cyan-500/40">
                  <h4 className="font-semibold text-white text-sm mb-1">{e.title}</h4>
                  <p className="text-gray-400 text-sm">{e.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quotes + Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(currentAnalysis.quotes?.length ?? 0) > 0 && (
          <div className="glass rounded-2xl p-8 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>💬</span> Key Quotes
            </h3>
            <div className="space-y-3">
              {currentAnalysis.quotes!.map((q, i) => (
                <div key={i} className="glass rounded-xl p-5 border-l-4 border-pink-500/40">
                  <p className="text-gray-200 text-sm italic leading-relaxed mb-2">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <p className="text-gray-500 text-xs">— {q.meaning}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(currentAnalysis.warnings_or_weak_claims?.length ?? 0) > 0 && (
          <div className="glass rounded-2xl p-8 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>⚠️</span> Warnings & Weak Claims
            </h3>
            <div className="space-y-3">
              {currentAnalysis.warnings_or_weak_claims!.map((w, i) => (
                <div key={i} className="glass rounded-xl p-4 border border-red-500/20">
                  <p className="text-red-400 text-xs font-medium mb-1">⚠ {w.claim}</p>
                  <p className="text-gray-500 text-xs">{w.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Final Takeaway */}
      {currentAnalysis.final_takeaway && (
        <div className="glass rounded-2xl p-8 border border-white/5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span>🏁</span> Final Takeaway
          </h3>
          <p className="text-blue-200 text-lg leading-relaxed font-medium">
            {currentAnalysis.final_takeaway}
          </p>
        </div>
      )}

      {/* Report Generation */}
      <ReportViewer />
    </div>
  );
}
