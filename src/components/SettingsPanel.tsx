"use client";

import { useState } from "react";
import { useApp } from "@/lib/providers";
import { AI_PROVIDERS, PROVIDER_DEFAULTS, type AIProvider, type BYOKConfig } from "@/types";

export default function SettingsPanel() {
  const { settings, setSettings } = useApp();
  const [form, setForm] = useState<BYOKConfig>(
    settings ?? {
      provider: "OpenAI",
      baseUrl: PROVIDER_DEFAULTS.OpenAI.baseUrl,
      apiKey: "",
      model: PROVIDER_DEFAULTS.OpenAI.defaultModel,
    }
  );
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleProviderChange = (provider: AIProvider) => {
    const defaults = PROVIDER_DEFAULTS[provider];
    setForm({
      ...form,
      provider,
      baseUrl: defaults.baseUrl,
      model: defaults.defaultModel,
    });
  };

  const handleSave = () => {
    if (!form.apiKey.trim()) {
      alert("Please enter an API key");
      return;
    }
    setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTest = async () => {
    if (!form.apiKey.trim()) {
      alert("Please enter an API key first");
      return;
    }
    // Simple test: try a basic API call
    try {
      const response = await fetch(`${form.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${form.apiKey}`,
        },
        body: JSON.stringify({
          model: form.model,
          messages: [{ role: "user", content: "Say 'Connected!' and nothing else." }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        alert("✅ Connection successful! Your API key works.");
      } else {
        const error = await response.text();
        alert(`❌ API Error (${response.status}): ${error.slice(0, 200)}`);
      }
    } catch (err) {
      alert(`❌ Connection failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  return (
    <div className="glass rounded-2xl border border-white/5 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl">
          🔑
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">AI Provider Settings</h2>
          <p className="text-sm text-gray-400">
            Configure your own API key (BYOK) for AI analysis
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">Provider</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {AI_PROVIDERS.map((p) => (
              <button
                key={p}
                onClick={() => handleProviderChange(p)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                  form.provider === p
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Base URL
          </label>
          <input
            type="text"
            value={form.baseUrl}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
          />
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm font-mono"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showKey ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Model Name
          </label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            placeholder="gpt-4o"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Check your provider's documentation for available model names
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center gap-2"
          >
            {saved ? (
              <>
                <span>✓</span>
                Saved!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Settings
              </>
            )}
          </button>
          <button
            onClick={handleTest}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Test Connection
          </button>
        </div>
      </div>

      {/* Supported Providers Info */}
      <div className="mt-8 pt-6 border-t border-white/5">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Supported Providers</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {AI_PROVIDERS.map((p) => (
            <div key={p} className="text-xs text-gray-500 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
              {p}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Any OpenAI-compatible endpoint also works (e.g., Together AI, Fireworks AI, etc.)
        </p>
      </div>
    </div>
  );
}
