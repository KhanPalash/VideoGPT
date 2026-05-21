export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString();
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...";
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function parseYouTubeUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function parseVimeoUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export function parseLoomUrl(url: string): string | null {
  const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export function detectVideoSource(url: string): { type: "youtube" | "vimeo" | "loom" | "mp4"; id?: string } | null {
  if (parseYouTubeUrl(url)) return { type: "youtube", id: parseYouTubeUrl(url)! };
  if (parseVimeoUrl(url)) return { type: "vimeo", id: parseVimeoUrl(url)! };
  if (parseLoomUrl(url)) return { type: "loom", id: parseLoomUrl(url)! };
  if (url.match(/\.(mp4|webm|ogg)(\?.*)?$/i)) return { type: "mp4" };
  if (url.match(/^https?:\/\//)) return { type: "mp4" }; // fallback: treat as direct video URL
  return null;
}

export function estimateReadingTime(text: string): string {
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  if (minutes < 1) return "< 1 min";
  if (minutes === 1) return "1 min";
  return `${minutes} mins`;
}
