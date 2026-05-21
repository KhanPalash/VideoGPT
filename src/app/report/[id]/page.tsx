"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Report } from "@/types";
import { getReport } from "@/lib/storage";
import { formatTimestamp } from "@/lib/utils";

export default function ReportPage() {
  const params = useParams();
  const id = params.id as string;
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    if (id) setReport(getReport(id));
  }, [id]);

  if (!report) {
    return (
      <div className="text-center py-24 animate-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center text-3xl">
          📄
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Report not found</h2>
        <p className="text-gray-400 mb-6">This report may have been deleted.</p>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-500 hover:to-purple-500 transition-all inline-flex items-center gap-2"
        >
          ← Back Home
        </Link>
      </div>
    );
  }

  const handleDownload = () => {
    const blob = new Blob([report.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 mb-2"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-white">{report.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generated {formatTimestamp(report.createdAt)}
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-pink-600 text-white font-medium hover:from-orange-500 hover:to-pink-500 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2"
        >
          <span>⬇️</span>
          Download HTML
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <iframe
          srcDoc={report.html}
          className="w-full h-[80vh] bg-black"
          title={report.title}
        />
      </div>
    </div>
  );
}
