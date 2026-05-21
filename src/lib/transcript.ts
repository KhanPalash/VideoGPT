import type { Transcript, TranscriptSegment, VideoSource } from "@/types";
import { parseYouTubeUrl } from "./utils";

/**
 * Fetch YouTube transcript by calling our own API route (server-side proxy).
 * Avoids CORS issues since the API route runs on the server.
 */
export async function fetchYouTubeTranscript(videoId: string): Promise<TranscriptSegment[]> {
  const response = await fetch(`/api/transcript?vid=${videoId}`);

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Transcript API returned ${response.status}`);
  }

  const body = await response.json();

  if (!Array.isArray(body.segments)) {
    throw new Error("Unexpected response format from transcript API");
  }

  return body.segments.map(
    (seg: { text: string; start?: number; duration?: number }, i: number) => ({
      start: seg.start ?? i * 5,
      end: (seg.start ?? i * 5) + (seg.duration ?? 5),
      text: seg.text
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">"),
    })
  );
}

/**
 * Extract transcript from a video source.
 * Throws an error with a clear message if the transcript cannot be fetched.
 */
export async function extractTranscript(source: VideoSource): Promise<Transcript> {
  let segments: TranscriptSegment[];

  if (source.type === "youtube") {
    if (!source.url) {
      throw new Error("No URL provided for the YouTube video.");
    }
    const videoId = parseYouTubeUrl(source.url);
    if (!videoId) {
      throw new Error(
        "Could not extract a valid YouTube video ID from the provided URL. " +
        "Please check that the URL is correct."
      );
    }
    segments = await fetchYouTubeTranscript(videoId);
  } else if (source.type === "vimeo") {
    throw new Error("Vimeo transcript extraction is not yet supported. Please provide a YouTube URL.");
  } else {
    throw new Error(
      `Transcript extraction for "${source.type}" sources is not yet supported. ` +
      "Please provide a YouTube URL."
    );
  }

  const fullText = segments.map((s) => s.text).join(" ");

  return {
    source,
    segments,
    fullText,
  };
}
