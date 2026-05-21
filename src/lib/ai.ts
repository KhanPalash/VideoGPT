import type { BYOKConfig, AIProvider } from "@/types";
import { PROVIDER_DEFAULTS } from "@/types";

export class AIClient {
  private config: BYOKConfig;

  constructor(config: BYOKConfig) {
    this.config = config;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.config.provider === "Anthropic") {
      headers["x-api-key"] = this.config.apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  private getEndpoint(): string {
    const base = this.config.baseUrl.replace(/\/+$/, "");
    if (this.config.provider === "Anthropic") {
      return `${base}/messages`;
    }
    if (this.config.provider === "Gemini") {
      return `${base}/models/${this.config.model}:generateContent`;
    }
    return `${base}/chat/completions`;
  }

  async chat(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options?: { temperature?: number; maxTokens?: number; stream?: boolean }
  ): Promise<string> {
    const endpoint = this.getEndpoint();

    if (this.config.provider === "Anthropic") {
      return this.anthropicChat(endpoint, messages, options);
    }

    if (this.config.provider === "Gemini") {
      return this.geminiChat(endpoint, messages, options);
    }

    return this.openaiCompatibleChat(endpoint, messages, options);
  }

  private async anthropicChat(
    endpoint: string,
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model: this.config.model,
      max_tokens: options?.maxTokens ?? 4096,
      messages: chatMessages,
    };

    if (systemMsg) {
      body.system = systemMsg.content;
    }
    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${error}`);
    }

    const text = await response.text();
    return this.safeExtractJsonString(text, "content[0].text");
  }

  private async geminiChat(
    endpoint: string,
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const systemMsg = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const contents = chatMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        ...(options?.temperature !== undefined && { temperature: options.temperature }),
        ...(options?.maxTokens !== undefined && { maxOutputTokens: options.maxTokens }),
      },
    };

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.config.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${error}`);
    }

    const text = await response.text();
    return this.safeExtractJsonString(text, "candidates[0].content.parts[0].text");
  }

  private async openaiCompatibleChat(
    endpoint: string,
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      stream: false,
      ...(options?.temperature !== undefined && { temperature: options.temperature }),
      ...(options?.maxTokens !== undefined && { max_tokens: options.maxTokens }),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error (${response.status}): ${error}`);
    }

    const text = await response.text();

    // Some providers always return SSE-like data even for non-streaming requests.
    // Try to handle that gracefully by extracting JSON from it.
    try {
      const parsed = JSON.parse(text);
      return parsed.choices?.[0]?.message?.content ?? parsed.content ?? "";
    } catch {
      // If normal JSON parse fails, the response might be SSE format.
      // Try to extract JSON from the first "data: " line.
      try {
        return this.extractFromSSEText(text);
      } catch {
        throw new Error(
          "Could not parse API response. The provider returned an unexpected format. " +
          "Please check your settings (base URL, model name)."
        );
      }
    }
  }

  /**
   * Safely parse a response text, stripping SSE prefixes and extracting the relevant field.
   * Falls back to returning the raw text if parsing fails.
   */
  private safeExtractJsonString(text: string, _path: string): string {
    try {
      // Handle SSE-prefixed data
      const cleanText = this.stripSSEPrefix(text);
      const parsed = JSON.parse(cleanText);

      // Extract using string path like "content[0].text" or "candidates[0].content.parts[0].text"
      const parts = _path.split(".");
      let value: unknown = parsed;
      for (const part of parts) {
        if (value === null || value === undefined) return "";
        // Handle array indexing like "content[0]"
        const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
        if (arrayMatch) {
          const [, key, index] = arrayMatch;
          value = (value as Record<string, unknown>)[key];
          if (Array.isArray(value)) value = value[parseInt(index)];
        } else {
          value = (value as Record<string, unknown>)[part];
        }
      }
      return typeof value === "string" ? value : JSON.stringify(value);
    } catch {
      return text;
    }
  }

  /**
   * Strip SSE "data: " prefix from text if present
   */
  private stripSSEPrefix(text: string): string {
    const trimmed = text.trim();
    // Handle "data: " prefix
    if (trimmed.startsWith("data: ")) {
      return trimmed.slice(6).trim();
    }
    if (trimmed.startsWith("data:")) {
      return trimmed.slice(5).trim();
    }
    return trimmed;
  }

  /**
   * Extract text content from an SSE-formatted text (multiple "data: ..." lines)
   */
  private extractFromSSEText(text: string): string {
    let fullContent = "";
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let data: string;
      if (trimmed.startsWith("data: ")) {
        data = trimmed.slice(6).trim();
      } else if (trimmed.startsWith("data:")) {
        data = trimmed.slice(5).trim();
      } else {
        continue;
      }

      if (!data || data === "[DONE]") continue;

      try {
        const jsonStart = data.indexOf("{");
        const jsonEnd = data.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          const jsonStr = data.slice(jsonStart, jsonEnd + 1);
          const parsed = JSON.parse(jsonStr);
          const content =
            parsed.choices?.[0]?.delta?.content ??
            parsed.choices?.[0]?.message?.content ??
            parsed.content ??
            "";
          fullContent += content;
        }
      } catch {
        // skip malformed lines
      }
    }
    if (!fullContent) throw new Error("No content extracted from SSE response");
    return fullContent;
  }

  async *streamChat(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<string> {
    if (this.config.provider === "Anthropic") {
      yield* this.anthropicStreamChat(messages, options);
      return;
    }

    if (this.config.provider === "Gemini") {
      yield* this.geminiStreamChat(messages, options);
      return;
    }

    yield* this.openaiStreamChat(messages, options);
  }

  private async *openaiStreamChat(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<string> {
    const endpoint = this.getEndpoint();

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
      stream: true,
      ...(options?.temperature !== undefined && { temperature: options.temperature }),
      ...(options?.maxTokens !== undefined && { max_tokens: options.maxTokens }),
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Streaming not available (${response.status}). Falling back to non-streaming.`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Handle both "data: " and "data:" formats
        let data: string;
        if (trimmed.startsWith("data: ")) {
          data = trimmed.slice(6);
        } else if (trimmed.startsWith("data:")) {
          data = trimmed.slice(5);
        } else {
          continue;
        }

        data = data.trim();
        if (!data || data === "[DONE]") {
          // Don't return here — just skip this line and keep reading
          // (some providers send "[DONE]" before the stream actually ends)
          continue;
        }

        try {
          // Handle JSON arrays like [{...}, {...}] (some providers use this format)
          let content = "";

          if (data.startsWith("[")) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                content += item.choices?.[0]?.delta?.content ?? "";
              }
            }
          } else {
            // Extract the outermost JSON object (handles extra text after JSON)
            const jsonStart = data.indexOf("{");
            const jsonEnd = data.lastIndexOf("}");
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
              const jsonStr = data.slice(jsonStart, jsonEnd + 1);
              const parsed = JSON.parse(jsonStr);
              content = parsed.choices?.[0]?.delta?.content ?? "";
            }
          }

          if (content) yield content;
        } catch {
          // skip malformed lines
        }
      }
    }
  }

  private async *anthropicStreamChat(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<string> {
    const endpoint = this.getEndpoint();

    const systemMsg = messages.find((m) => m.role === "system");
    const chatMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model: this.config.model,
      max_tokens: options?.maxTokens ?? 4096,
      messages: chatMessages,
      stream: true,
    };

    if (systemMsg) {
      body.system = systemMsg.content;
    }
    if (options?.temperature !== undefined) {
      body.temperature = options.temperature;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic streaming error (${response.status}): ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Anthropic SSE uses "event:" and "data:" lines
        if (!trimmed.startsWith("data:")) continue;

        let data: string;
        if (trimmed.startsWith("data: ")) {
          data = trimmed.slice(6).trim();
        } else {
          data = trimmed.slice(5).trim();
        }

        if (!data) continue;

        try {
          const parsed = JSON.parse(data);
          // content_block_delta events contain incremental text
          if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
            const content = parsed.delta.text;
            if (content) yield content;
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  }

  private async *geminiStreamChat(
    messages: { role: "system" | "user" | "assistant"; content: string }[],
    options?: { temperature?: number; maxTokens?: number }
  ): AsyncGenerator<string> {
    const base = this.config.baseUrl.replace(/\/+$/, "");
    const endpoint = `${base}/models/${this.config.model}:streamGenerateContent?alt=sse`;

    const systemMsg = messages.find((m) => m.role === "system");
    const chatMessages = messages.filter((m) => m.role !== "system");

    const contents = chatMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        ...(options?.temperature !== undefined && { temperature: options.temperature }),
        ...(options?.maxTokens !== undefined && { maxOutputTokens: options.maxTokens }),
      },
    };

    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.config.apiKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini streaming error (${response.status}): ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let data: string;
        if (trimmed.startsWith("data: ")) {
          data = trimmed.slice(6).trim();
        } else if (trimmed.startsWith("data:")) {
          data = trimmed.slice(5).trim();
        } else {
          continue;
        }

        if (!data) continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (content) yield content;
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}

export function getDefaultConfig(provider: AIProvider): Partial<BYOKConfig> {
  const defaults = PROVIDER_DEFAULTS[provider];
  return {
    provider,
    baseUrl: defaults.baseUrl,
    model: defaults.defaultModel,
  };
}
