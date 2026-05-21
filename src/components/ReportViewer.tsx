"use client";

import { useState } from "react";
import { useApp } from "@/lib/providers";
import { formatTimestamp } from "@/lib/utils";

export default function ReportViewer() {
  const { currentAnalysis, generateReport, reports } = useApp();
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const latestReport = reports[0];

  const handleGenerate = async () => {
    if (!currentAnalysis) return;
    setGenerating(true);
    try {
      await generateReport();
      setShowPreview(true);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!latestReport) return;
    const blob = new Blob([latestReport.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${latestReport.title.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentAnalysis) return null;

  return (
    <div className="glass rounded-2xl border border-white/5 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-lg">
            📄
          </div>
          <div>
            <h3 className="font-semibold text-white">HTML Report</h3>
            <p className="text-xs text-gray-500">
              Generate a beautiful interactive report
            </p>
          </div>
        </div>

        {latestReport && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm"
            >
              {showPreview ? "Close Preview" : "Preview"}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-pink-600 text-white text-sm font-medium hover:from-orange-500 hover:to-pink-500 transition-all shadow-lg shadow-orange-500/20"
            >
              Download HTML
            </button>
          </div>
        )}
      </div>

      {!latestReport ? (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-4">
            Generate a premium HTML report from this analysis
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-pink-600 text-white font-medium hover:from-orange-500 hover:to-pink-500 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20 flex items-center gap-2 mx-auto"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <span>✨</span>
                Generate Report
              </>
            )}
          </button>
        </div>
      ) : showPreview ? (
        <div className="border border-white/10 rounded-xl overflow-hidden">
          <div className="bg-white/5 px-4 py-2 flex items-center justify-between border-b border-white/5">
            <span className="text-sm text-gray-400">{latestReport.title}</span>
            <span className="text-xs text-gray-500">
              {formatTimestamp(latestReport.createdAt)}
            </span>
          </div>
          {/* XSS risk: srcDoc renders raw HTML, but all interpolated values in
              generateReportHTML are sanitized via escapeHtml() in providers.tsx */}
          <iframe
            srcDoc={latestReport.html}
            className="w-full h-[500px] bg-black"
            title="Report Preview"
          />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/5 text-center">
            <p className="text-2xl font-bold text-white">{currentAnalysis.main_points?.length ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Main Points</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 text-center">
            <p className="text-2xl font-bold text-white">{currentAnalysis.ideas_discussed?.length ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Ideas</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 text-center">
            <p className="text-2xl font-bold text-white">{currentAnalysis.implementation_ideas?.length ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Action Plans</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 text-center">
            <p className="text-2xl font-bold text-white">{currentAnalysis.business_insights?.length ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Business</p>
          </div>
        </div>
      )}
    </div>
  );
}
