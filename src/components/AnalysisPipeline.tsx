"use client";

import { useApp } from "@/lib/providers";

export default function AnalysisPipeline() {
  const { isAnalyzing, analysisProgress } = useApp();

  if (!isAnalyzing) return null;

  const steps = [
    { label: "Extracting transcript...", icon: "📝" },
    { label: "Running AI analysis...", icon: "🧠" },
    { label: "Extracting key insights...", icon: "💡" },
    { label: "Identifying topics...", icon: "📋" },
    { label: "Generating action items...", icon: "🎯" },
    { label: "Analysis complete!", icon: "✅" },
  ];

  const currentStepIndex = steps.findIndex(
    (s) => analysisProgress.includes(s.label) || analysisProgress === s.label
  );

  const displayStep = currentStepIndex >= 0 ? currentStepIndex : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10">
        {/* Progress */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Analyzing Video
          </h3>
          <p className="text-gray-400 text-sm">{analysisProgress}</p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => {
            const isActive = i === displayStep;
            const isDone = i < displayStep;
            const isPending = i > displayStep;

            return (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-500/10 border border-blue-500/20"
                    : isDone
                    ? "bg-emerald-500/5 border border-transparent"
                    : "bg-white/5 border border-transparent opacity-40"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                    isDone
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isActive
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-white/10 text-gray-500"
                  }`}
                >
                  {isDone ? "✓" : step.icon}
                </div>
                <span
                  className={`text-sm ${
                    isDone
                      ? "text-emerald-400"
                      : isActive
                      ? "text-blue-300"
                      : "text-gray-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
