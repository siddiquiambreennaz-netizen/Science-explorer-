// Server-only AI provider adapter. Supports Gemini API and the existing Lovable gateway.
// API keys must remain server-side and must never be exposed to browser code.
export type AiResult = { ok: true; answer: string } | { ok: false; error: string };

type InputPart = { type?: string; text?: string; image_url?: string };
type InputMessage = { role?: string; content?: string | InputPart[] };

type GeminiSchema = {
  type?: string;
  format?: string;
  description?: string;
  nullable?: boolean;
  enum?: unknown[];
  items?: GeminiSchema;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  propertyOrdering?: string[];
  minItems?: number;
  maxItems?: number;
};

function convertSchema(value: unknown): GeminiSchema | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const source = value as Record<string, unknown>;
  const schema: GeminiSchema = {};
  if (typeof source.type === "string") schema.type = source.type.toUpperCase();
  if (typeof source.format === "string") schema.format = source.format;
  if (typeof source.description === "string") schema.description = source.description;
  if (typeof source.nullable === "boolean") schema.nullable = source.nullable;
  if (Array.isArray(source.enum)) schema.enum = source.enum;
  if (Array.isArray(source.required)) schema.required = source.required.filter((x): x is string => typeof x === "string");
  if (typeof source.minItems === "number") schema.minItems = source.minItems;
  if (typeof source.maxItems === "number") schema.maxItems = source.maxItems;
  if (source.items) schema.items = convertSchema(source.items);
  if (source.properties && typeof source.properties === "object" && !Array.isArray(source.properties)) {
    schema.properties = {};
    for (const [key, child] of Object.entries(source.properties as Record<string, unknown>)) {
      const converted = convertSchema(child);
      if (converted) schema.properties[key] = converted;
    }
    if (schema.required) schema.propertyOrdering = Object.keys(schema.properties);
  }
  return schema;
}

function toGeminiContents(input: unknown): Array<{ role: "user" | "model"; parts: Array<Record<string, unknown>> }> {
  const messages = Array.isArray(input) ? (input as InputMessage[]) : [{ role: "user", content: String(input ?? "") }];
  return messages.map((message) => {
    const role = message.role === "assistant" || message.role === "model" ? "model" : "user";
    const content = message.content;
    const rawParts: InputPart[] = typeof content === "string" ? [{ type: "input_text", text: content }] : Array.isArray(content) ? content : [];
    const parts: Array<Record<string, unknown>> = [];
    for (const part of rawParts) {
      if ((part.type === "input_image" || part.type === "image_url") && typeof part.image_url === "string") {
        const match = part.image_url.match(/^data:([^;,]+);base64,(.+)$/s);
        if (match) parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        else parts.push({ text: "[An image was provided, but its URL could not be converted to Gemini inline image data.]" });
      } else if (typeof part.text === "string") {
        parts.push({ text: part.text });
      }
    }
    return { role, parts: parts.length ? parts : [{ text: "" }] };
  });
}

// Stable, public Gemini model IDs. Prefer Flash-Lite for fast student chat;
// fall back to Flash when overloaded or unavailable.
const GEMINI_FALLBACK_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash"];
// Tutor chat needs enough time for a real provider response plus one model fallback.
// The previous six-second total / 3.5-second per-model limits were too aggressive.
const TUTOR_TOTAL_TIMEOUT_MS = 30_000;
const TUTOR_ATTEMPT_TIMEOUT_MS = 14_000;

async function callGemini(body: Record<string, unknown>, label: string, key: string): Promise<AiResult> {
  // Honour an explicitly selected model first, but automatically try current stable Flash
  // models when Google reports temporary overload (503) or a model is unavailable (404).
  const configuredModel = process.env["GEMINI_MODEL"]?.trim();
  const preferredModel = configuredModel && GEMINI_FALLBACK_MODELS.includes(configuredModel)
    ? configuredModel
    : GEMINI_FALLBACK_MODELS[0]!;
  const models = [...new Set([preferredModel, ...GEMINI_FALLBACK_MODELS])];
  const textFormat = body.text && typeof body.text === "object"
    ? (body.text as Record<string, unknown>).format as Record<string, unknown> | undefined
    : undefined;
  const formatSchema = textFormat?.type === "json_schema" ? convertSchema(textFormat.schema) : undefined;
  const generationConfig: Record<string, unknown> = {
    temperature: label === "tutor" ? 0.35 : label === "game" ? 0.35 : 0.45,
    maxOutputTokens: label === "tutor" ? 300 : label === "game" ? 2400 : label === "scan" ? 1200 : 4096,
    thinkingConfig: { thinkingLevel: "low" },
  };
  if (formatSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = formatSchema;
  }

  const requestBody: Record<string, unknown> = {
    contents: toGeminiContents(body.input),
    ...(typeof body.instructions === "string" && body.instructions.trim()
      ? { systemInstruction: { parts: [{ text: body.instructions }] } }
      : {}),
    ...(Object.keys(generationConfig).length ? { generationConfig } : {}),
  };

  let lastStatus = 0;
  let lastProviderText = "";
  const requestDeadline = label === "tutor" ? Date.now() + TUTOR_TOTAL_TIMEOUT_MS : label === "game" ? Date.now() + 22000 : Number.POSITIVE_INFINITY;
  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    if (!model) continue;
    const remainingMs = requestDeadline - Date.now();
    if (remainingMs <= 0) break;
    let res: Response;
    try {
      // Give Tutor each model a useful response window while keeping the overall
      // request bounded. If the first model stalls, the remaining time is used for fallback.
      const timeoutMs = label === "tutor" ? Math.max(1, Math.min(TUTOR_ATTEMPT_TIMEOUT_MS, remainingMs))
        : label === "game" ? Math.max(1, Math.min(13000, remainingMs)) : 15000;
      const modelGenerationConfig = { ...generationConfig, thinkingConfig: { thinkingLevel: model === "gemini-3.5-flash-lite" ? "minimal" : "low" } };
      const modelRequestBody = { ...requestBody, generationConfig: modelGenerationConfig };
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify(modelRequestBody),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      console.error(`Gemini ${label} network/timeout error for model ${model}:`, error);
      if ((label === "tutor" || label === "game") && index < models.length - 1 && Date.now() < requestDeadline) continue;
      return { ok: false, error: label === "tutor"
        ? "The tutor could not get a response within 30 seconds. Please try again; network and provider load can affect response time."
        : label === "game"
          ? "The AI game generator timed out. Check the connection and server .env settings, then try again."
          : "Could not reach Gemini. Check your internet connection and try again." };
    }

    if (!res.ok) {
      lastStatus = res.status;
      lastProviderText = await res.text().catch(() => "");
      console.error(`Gemini ${label} model=${model} error [${res.status}]: ${lastProviderText}`);
      const canFallback = (res.status === 408 || res.status === 503 || res.status === 404 || res.status === 500 || res.status === 502 || res.status === 504)
        && index < models.length - 1;
      if (canFallback) continue;
      if (res.status === 401 || res.status === 403) return { ok: false, error: "Gemini authentication failed or this API key does not have access. Check your server-side Gemini API key and restrictions." };
      if (res.status === 429) return { ok: false, error: "Gemini rate limit or quota reached. Please wait, check your Google AI Studio quota, and try again." };
      if (res.status === 503 || res.status === 500 || res.status === 502 || res.status === 504) {
        return { ok: false, error: "Gemini is experiencing high demand. Alternative models were tried automatically, but none answered. Please wait a moment and retry." };
      }
      if (res.status === 404) return { ok: false, error: "Neither supported Gemini model is available to this API key. Check that your Google AI Studio key is active and that the Gemini API is enabled for its project." };
      return { ok: false, error: "Gemini could not answer right now. Check the server logs and try again." };
    }

    const payload = await res.json().catch(() => null) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
      promptFeedback?: { blockReason?: string };
      error?: { message?: string };
    } | null;
    const answer = payload?.candidates?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text ?? "").join("").trim() ?? "";
    if (!answer) {
      console.error(`Gemini ${label} model=${model} returned no text: ${JSON.stringify(payload?.promptFeedback ?? payload?.candidates?.[0]?.finishReason ?? payload?.error ?? {})}`);
      return { ok: false, error: "Gemini returned no answer. Please try again or check the server logs." };
    }
    if (model !== preferredModel) console.info(`Gemini ${label} answered using fallback model ${model}.`);
    return { ok: true, answer };
  }

  console.error(`Gemini ${label} exhausted model fallbacks. Last status: ${lastStatus}; provider response: ${lastProviderText}`);
  return { ok: false, error: label === "tutor" && Date.now() >= requestDeadline
    ? "The tutor reached its 30-second response limit after trying the available models. Please try again; provider or network speed can vary."
    : label === "game" && Date.now() >= requestDeadline
      ? "Game generation reached its 22-second response limit. Try again or check Gemini's live connection in AI Overview."
      : "Gemini could not answer after trying available models. Please try again shortly." };
}

async function callLovable(body: Record<string, unknown>, label: string, key: string): Promise<AiResult> {
  let res: Response;
  try {
    res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra", store: false, stream: true,
        reasoning: { effort: "low", summary: "auto" }, include: ["reasoning.encrypted_content"], ...body,
      }),
      signal: AbortSignal.timeout(label === "tutor" ? TUTOR_TOTAL_TIMEOUT_MS : label === "game" ? 45_000 : 30_000),
    });
  } catch {
    return { ok: false, error: "Could not reach the AI service. Check your connection and try again." };
  }
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    console.error(`AI gateway ${label} error [${res.status}]: ${text}`);
    if (res.status === 402) return { ok: false, error: "AI credits are used up for now. Please try again later." };
    if (res.status === 429) return { ok: false, error: "The AI is busy right now. Please wait a moment and try again." };
    if (res.status === 403) return { ok: false, error: "AI access is blocked for this workspace right now." };
    return { ok: false, error: "The AI could not answer right now. Please try again." };
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";
  let streamError = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const evt = JSON.parse(payload) as { type?: string; delta?: string; message?: string };
          if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") answer += evt.delta;
          if (evt.type === "response.failed" || evt.type === "error") streamError = evt.message ?? "The request failed.";
        } catch { /* ignore keep-alive fragments */ }
      }
    }
  } catch (error) {
    console.error(`AI gateway ${label} stream interrupted:`, error);
    return { ok: false, error: label === "tutor"
      ? "The tutor response timed out or the connection was interrupted. Please try again."
      : "The AI response was interrupted. Please try again." };
  }
  if (streamError) return { ok: false, error: "The AI request failed while generating a response. Please try again." };
  if (!answer.trim()) return { ok: false, error: "The AI returned an empty answer. Please try again." };
  return { ok: true, answer: answer.trim() };
}

export async function streamResponse(body: Record<string, unknown>, label: string): Promise<AiResult> {
  const candidateGeminiKey = (process.env["GEMINI_API_KEY"] || process.env["GOOGLE_API_KEY"] || "").trim();
  const geminiKey = candidateGeminiKey && !/^(your_|put_your|replace_me)/i.test(candidateGeminiKey) ? candidateGeminiKey : "";
  if (geminiKey) return callGemini(body, label, geminiKey);
  const candidateLovableKey = (process.env["LOVABLE_API_KEY"] || "").trim();
  const lovableKey = candidateLovableKey && !/^(your_|put_your|replace_me)/i.test(candidateLovableKey) ? candidateLovableKey : "";
  if (lovableKey) return callLovable(body, label, lovableKey);
  return {
    ok: false,
    error: "AI is not configured. Do not put your key only in .env.example. Copy .env.example to a real .env file beside package.json, add your GEMINI_API_KEY there, save it, and restart npm run dev.",
  };
}
