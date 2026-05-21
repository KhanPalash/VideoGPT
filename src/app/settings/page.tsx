"use client";

import SettingsPanel from "@/components/SettingsPanel";

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto animate-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-gray-400 mt-2">
          Configure your AI provider to power VideoGPT&apos;s analysis
        </p>
      </div>
      <SettingsPanel />
    </div>
  );
}
