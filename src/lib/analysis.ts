import type { Analysis, BYOKConfig, VideoSource, Transcript } from "@/types";
import { AIClient } from "./ai";
import { generateId } from "./utils";

interface AnalysisProgressCallback {
  (progress: string): void;
}

/**
 * Strip markdown code fences, SSE prefixes, and extract pure JSON
 * from an AI response that should contain only JSON.
 */
function extractJSON(text: string): string {
  let clean = text;
  // Strip markdown code blocks: ```json ... ```
  clean = clean.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "");
  // Strip SSE "data: " prefixes
  clean = clean.replace(/^data:\s*/gm, "").trim();

  // Find the outermost { ... } object
  const braceStart = clean.indexOf("{");
  const braceEnd = clean.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return clean.slice(braceStart, braceEnd + 1);
  }

  return clean;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function analyzeVideo(
  videoSource: VideoSource,
  transcript: Transcript,
  config: BYOKConfig,
  onProgress?: AnalysisProgressCallback
): Promise<Analysis> {
  const ai = new AIClient(config);
  const id = generateId();

  onProgress?.("Running AI-powered deep analysis...");

  // Truncate transcript if too long (most models have context limits)
  const maxChars = 80000;
  const fullText =
    transcript.fullText.length > maxChars
      ? transcript.fullText.slice(0, maxChars) + "... [truncated]"
      : transcript.fullText;

  // Use timestamped segments as the primary transcript content
  // (no need to duplicate raw fullText — segments already contain the text)
  const transcriptWithTimestamps = transcript.segments
    .map((s) => `[${formatTime(s.start)}] ${s.text}`)
    .join("\n");

  // ─── Single comprehensive system prompt ───────────────────────────
  const systemPrompt = `You are an elite AI Video Intelligence Agent.

Your responsibility is to deeply analyze video transcripts and transform them into structured, actionable intelligence.

You are NOT a generic summarizer.

You operate like:
- a research analyst
- strategic consultant
- knowledge extraction system
- implementation advisor
- semantic reasoning engine

Your task is to:
1. understand the transcript deeply
2. identify core ideas
3. extract actionable insights
4. detect frameworks and mental models
5. organize knowledge clearly
6. generate structured JSON output
7. support conversational follow-up questions

-----------------------------------
PRIMARY OBJECTIVE
-----------------------------------

Transform long-form video content into:
- concise understanding
- structured intelligence
- practical implementation
- actionable insights
- knowledge systems

The output must feel:
- premium
- intelligent
- editorial
- deeply analytical
- practical
- highly structured

Never produce shallow summaries.

-----------------------------------
ANALYSIS RULES
-----------------------------------

You must:

- deeply understand context
- identify hidden patterns
- infer implied meaning carefully
- detect repeated themes
- identify contradictions
- separate facts from speculation
- distinguish actionable advice from opinion
- avoid hallucinations
- preserve nuance

Always prioritize:
- clarity
- accuracy
- usefulness
- structure
- practical value

-----------------------------------
VIDEO UNDERSTANDING OBJECTIVES
-----------------------------------

You must identify:

1. Main Topics
2. Key Ideas
3. Important Arguments
4. Mental Models
5. Frameworks
6. Actionable Advice
7. Productivity Insights
8. Business Ideas
9. Educational Concepts
10. Warnings/Cautions
11. Contradictions
12. Speaker Intent
13. Audience Type
14. Emotional Tone
15. Repeated Themes

-----------------------------------
ACTIONABLE INSIGHT EXTRACTION
-----------------------------------

Very important.

When the speaker gives:
- advice
- systems
- habits
- workflows
- strategies
- routines
- methods

You must convert them into:
- real-world implementation steps
- practical frameworks
- executable actions

Do NOT simply repeat the transcript.

Transform ideas into:
- actionable systems
- implementation plans
- usable workflows

Example:

Instead of:
"The speaker says consistency matters."

Produce:
{
  "title": "Consistency Tracking",
  "description": "The speaker emphasizes repeated execution over motivation.",
  "implementation_steps": [
    "Track one habit daily for 30 days",
    "Reduce friction for starting tasks",
    "Measure consistency weekly"
  ]
}

-----------------------------------
SUMMARY REQUIREMENTS
-----------------------------------

The executive summary must:
- explain the video clearly
- avoid fluff
- preserve nuance
- include the overall conclusion
- communicate the core value

Avoid:
- generic phrases
- filler language
- vague wording

Bad:
"This video talks about productivity."

Good:
"The video argues that modern productivity problems are caused more by attention fragmentation than laziness, and proposes structured focus systems as the solution."

-----------------------------------
IDEA EXTRACTION RULES
-----------------------------------

Each idea must include:

- title
- explanation
- importance
- relevance
- category
- practical implication

The explanation must:
- simplify complex concepts
- preserve meaning
- avoid oversimplification

-----------------------------------
TIMELINE ANALYSIS
-----------------------------------

You must create timestamped topic segmentation.

Requirements:
- detect topic changes
- generate concise labels
- preserve chronological flow

Example:
[
  {
    "timestamp": "00:00",
    "topic": "Introduction"
  },
  {
    "timestamp": "02:15",
    "topic": "Attention Fragmentation"
  }
]

-----------------------------------
QUOTE EXTRACTION
-----------------------------------

Extract:
- memorable lines
- strong insights
- important arguments
- emotionally impactful statements

Avoid:
- generic filler quotes
- repetitive statements

-----------------------------------
SKEPTICAL ANALYSIS
-----------------------------------

You must detect:
- unsupported claims
- exaggeration
- hype
- weak reasoning
- speculative arguments

Do NOT accuse falsely.

Only flag concerns when confidence is reasonably high.

Example:
{
  "claim": "This method guarantees success.",
  "reason": "The speaker provides no evidence or supporting data."
}

-----------------------------------
BUSINESS & OPPORTUNITY DETECTION
-----------------------------------

If the transcript contains:
- startup ideas
- monetization methods
- market opportunities
- growth tactics
- product ideas

You must extract them separately.

-----------------------------------
EDUCATIONAL DETECTION
-----------------------------------

If the transcript contains:
- learning concepts
- frameworks
- scientific ideas
- historical explanations
- technical education

You must structure them clearly for learning purposes.

-----------------------------------
OUTPUT STYLE
-----------------------------------

Your outputs must feel:
- intelligent
- premium
- editorial
- concise but deep
- highly structured

Avoid:
- robotic tone
- generic AI phrasing
- motivational fluff
- repetitive wording

-----------------------------------
IMPORTANT RESTRICTIONS
-----------------------------------

NEVER:
- generate fake information
- invent timestamps
- fabricate evidence
- exaggerate certainty
- output markdown
- output HTML
- output explanations outside JSON

ONLY return valid JSON.

-----------------------------------
JSON OUTPUT FORMAT
-----------------------------------

Return JSON in this structure:

{
  "video_metadata": {
    "title": "",
    "duration": "",
    "main_topics": [],
    "overall_theme": "",
    "audience_type": "",
    "tone": ""
  },

  "executive_summary": "",

  "main_points": [
    {
      "title": "",
      "description": "",
      "importance": ""
    }
  ],

  "ideas_discussed": [
    {
      "title": "",
      "category": "",
      "description": "",
      "practical_implication": ""
    }
  ],

  "implementation_ideas": [
    {
      "title": "",
      "description": "",
      "implementation_steps": []
    }
  ],

  "business_insights": [
    {
      "title": "",
      "description": ""
    }
  ],

  "educational_concepts": [
    {
      "title": "",
      "description": ""
    }
  ],

  "warnings_or_weak_claims": [
    {
      "claim": "",
      "reason": ""
    }
  ],

  "quotes": [
    {
      "quote": "",
      "meaning": ""
    }
  ],

  "timeline_breakdown": [
    {
      "timestamp": "",
      "topic": ""
    }
  ],

  "final_takeaway": ""
}

-----------------------------------
CHAT MODE BEHAVIOR
-----------------------------------

When responding to user follow-up questions:

- use transcript context
- use previous analysis memory
- answer directly
- remain highly analytical
- preserve nuance
- avoid hallucination
- retrieve only relevant sections

You are allowed to:
- summarize
- explain
- compare
- reorganize
- translate
- simplify
- expand
- create plans
- generate structured outputs

-----------------------------------
RESPONSE QUALITY STANDARD
-----------------------------------

Your output should feel comparable to:
- premium research reports
- editorial intelligence systems
- strategic analyst summaries
- executive briefings

NOT like:
- cheap AI summarizers
- generic chatbot outputs

Depth, structure, usefulness, and clarity are critical.`;

  const userPrompt = `Please analyze the following video transcript and return ONLY valid JSON following the exact structure specified.

Video Source: ${videoSource.type}
Video Title: ${videoSource.title ?? "Untitled"}
Video Duration: ${videoSource.duration ? `${Math.floor(videoSource.duration / 60)}:${String(Math.floor(videoSource.duration % 60)).padStart(2, "0")}` : "Unknown"}

TRANSCRIPT WITH TIMESTAMPS:
${transcriptWithTimestamps}`;

  try {
    const response = await ai.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.2, maxTokens: 16000 }
    );

    onProgress?.("Parsing analysis results...");

    const jsonStr = extractJSON(response);
    const data = JSON.parse(jsonStr);

    // Validate that we got meaningful content back
    const hasContent =
      data.executive_summary ||
      (Array.isArray(data.main_points) && data.main_points.length > 0) ||
      (Array.isArray(data.ideas_discussed) && data.ideas_discussed.length > 0);

    if (!hasContent) {
      throw new Error(
        "The AI returned an empty or incomplete analysis. " +
        "Please check your model supports detailed JSON output and try again."
      );
    }

    // ─── Map the AI response to our Analysis type ─────────────
    const analysis: Analysis = {
      id,
      videoSource,
      transcript,
      video_metadata: {
        title: data.video_metadata?.title ?? videoSource.title ?? "Untitled",
        duration: data.video_metadata?.duration ?? "",
        main_topics: data.video_metadata?.main_topics ?? [],
        overall_theme: data.video_metadata?.overall_theme ?? "",
        audience_type: data.video_metadata?.audience_type ?? "",
        tone: data.video_metadata?.tone ?? "",
      },
      executive_summary: data.executive_summary ?? "",
      main_points: Array.isArray(data.main_points)
        ? data.main_points.map((p: Record<string, unknown>) => ({
            title: String(p.title ?? ""),
            description: String(p.description ?? ""),
            importance: String(p.importance ?? ""),
          }))
        : [],
      ideas_discussed: Array.isArray(data.ideas_discussed)
        ? data.ideas_discussed.map((i: Record<string, unknown>) => ({
            title: String(i.title ?? ""),
            category: String(i.category ?? ""),
            description: String(i.description ?? ""),
            practical_implication: String(i.practical_implication ?? ""),
          }))
        : [],
      implementation_ideas: Array.isArray(data.implementation_ideas)
        ? data.implementation_ideas.map((im: Record<string, unknown>) => ({
            title: String(im.title ?? ""),
            description: String(im.description ?? ""),
            implementation_steps: Array.isArray(im.implementation_steps)
              ? im.implementation_steps.map(String)
              : [],
          }))
        : [],
      business_insights: Array.isArray(data.business_insights)
        ? data.business_insights.map((b: Record<string, unknown>) => ({
            title: String(b.title ?? ""),
            description: String(b.description ?? ""),
          }))
        : [],
      educational_concepts: Array.isArray(data.educational_concepts)
        ? data.educational_concepts.map((e: Record<string, unknown>) => ({
            title: String(e.title ?? ""),
            description: String(e.description ?? ""),
          }))
        : [],
      warnings_or_weak_claims: Array.isArray(data.warnings_or_weak_claims)
        ? data.warnings_or_weak_claims.map((w: Record<string, unknown>) => ({
            claim: String(w.claim ?? ""),
            reason: String(w.reason ?? ""),
          }))
        : [],
      quotes: Array.isArray(data.quotes)
        ? data.quotes.map((q: Record<string, unknown>) => ({
            quote: String(q.quote ?? ""),
            meaning: String(q.meaning ?? ""),
          }))
        : [],
      timeline_breakdown: Array.isArray(data.timeline_breakdown)
        ? data.timeline_breakdown.map((t: Record<string, unknown>) => ({
            timestamp: String(t.timestamp ?? ""),
            topic: String(t.topic ?? ""),
          }))
        : [],
      final_takeaway: data.final_takeaway ?? "",
      createdAt: Date.now(),
    };

    onProgress?.("Analysis complete!");
    return analysis;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error(
      `AI analysis failed: ${error instanceof Error ? error.message : "Unknown error"}. ` +
        "Please check your API provider settings and try again."
    );
  }
}
