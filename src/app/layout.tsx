import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/providers";
import Header from "@/components/Header";
import AnalysisPipeline from "@/components/AnalysisPipeline";

export const metadata: Metadata = {
  title: "VideoGPT - AI Video Intelligence Platform",
  description:
    "Transform YouTube and video content into structured, actionable intelligence with AI-powered analysis, chat, and beautiful HTML reports.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <AnalysisPipeline />
        </AppProvider>
      </body>
    </html>
  );
}
