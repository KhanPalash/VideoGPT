import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("vid");

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return NextResponse.json(
      { error: "Invalid or missing video ID. Must be an 11-character YouTube video ID." },
      { status: 400 }
    );
  }

  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: "No captions available for this video. The video may not have auto-generated captions or transcripts enabled." },
        { status: 404 }
      );
    }

    const segments = transcript.map((seg: { text: string; offset?: number; duration?: number }) => ({
      start: (seg.offset ?? 0) / 1000,
      end: ((seg.offset ?? 0) + (seg.duration ?? 0)) / 1000,
      text: seg.text
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#x27;|&apos;/g, "'"),
    }));

    return NextResponse.json({ segments });
  } catch (error) {
    console.error("[transcript]", videoId, error instanceof Error ? error.message : error);

    const message =
      error instanceof Error
        ? error.message.includes("disabled")
          ? "Captions are disabled for this video."
          : error.message.includes("not found")
          ? "No captions found for this video. The video may not have transcripts available."
          : error.message.includes("timed out")
          ? "Transcript fetch timed out. Please try again later."
          : `Failed to fetch transcript: ${error.message}`
        : "Failed to fetch transcript. Please try again later.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
