"use client";

import { useState, useRef } from "react";
import { detectVideoSource, cn } from "@/lib/utils";
import { useApp } from "@/lib/providers";
import type { VideoSource } from "@/types";

interface VideoInputProps {
  onAnalysisStart?: () => void;
}

export default function VideoInput({ onAnalysisStart }: VideoInputProps) {
  const [url, setUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startAnalysis, isAnalyzing, settings } = useApp();

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError("Please enter a video URL");
      return;
    }

    if (!settings) {
      setError("Please configure your AI provider settings first");
      return;
    }

    const detected = detectVideoSource(url.trim());
    if (!detected) {
      setError("Could not detect video source. Supported: YouTube, Vimeo, Loom, or direct MP4 URLs");
      return;
    }

    setError(null);
    onAnalysisStart?.();

    const source: VideoSource = {
      type: detected.type,
      url: detected.id || url.trim(),
      title: detected.id ? `${detected.type} video` : url.trim(),
    };

    await startAnalysis(source);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For now, we handle uploaded files as local videos
    // In production, this would upload to a server or process locally
    alert("File upload will be processed in a future update. For now, please use a video URL.");
  };

  const examples = [
    { label: "YouTube Talk", url: "https://youtube.com/watch?v=dQw4w9WgXcQ" },
    { label: "TED Talk", url: "https://youtube.com/watch?v=8d6zP7Hj5yI" },
    { label: "Vimeo Doc", url: "https://vimeo.com/123456789" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Input */}
      <div
        className={cn(
          "relative group transition-all duration-300",
          isAnalyzing && "pointer-events-none opacity-50"
        )}
      >
        <div
          className={cn(
            "glass rounded-2xl p-6 md:p-8 border transition-all duration-300",
            isDragging
              ? "border-blue-400/50 bg-blue-500/5"
              : "border-white/5 hover:border-white/10"
          )}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) {
              fileInputRef.current?.files && (fileInputRef.current.files = e.dataTransfer.files);
              handleFileSelect({ target: { files: e.dataTransfer.files } } as any);
            }
          }}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                onKeyDown={handleKeyDown}
                placeholder="Paste YouTube, Vimeo, Loom, or MP4 URL..."
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all text-lg"
                disabled={isAnalyzing}
              />
            </div>

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 flex-shrink-0"
              disabled={isAnalyzing}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className="hidden md:inline">Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Analyze button */}
            <button
              onClick={handleSubmit}
              disabled={isAnalyzing || !url.trim()}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center gap-2 flex-shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Analyze
                </>
              )}
            </button>
          </div>

          {/* Examples */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Try:</span>
            {examples.map((ex) => (
              <button
                key={ex.label}
                onClick={() => { setUrl(ex.url); setError(null); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
