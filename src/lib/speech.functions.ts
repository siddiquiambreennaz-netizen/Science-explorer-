import { createServerFn } from "@tanstack/react-start";
import { Buffer } from "node:buffer";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const speechLangSchema = z.enum(["en", "ur", "roman", "sd"]);
const voiceLang: Record<"en" | "ur" | "roman" | "sd", "en" | "ur" | "sd"> = {
  en: "en",
  ur: "ur",
  roman: "ur",
  sd: "sd",
};

type ElevenVoice = {
  voice_id?: string;
  name?: string;
  labels?: Record<string, string>;
  verified_languages?: Array<{ language?: string; accent?: string; locale?: string }>;
};

const selectedVoiceCache = new Map<string, { voiceId: string; voiceName: string; expiresAt: number }>();

function authErrorMessage(status: number, details: string, phase: "voice lookup" | "speech generation"): string {
  const message = details.toLowerCase();
  if (message.includes("voices_read") || (message.includes("permission") && message.includes("voices"))) {
    return "ElevenLabs key is being read, but it cannot list voices. In ElevenLabs → Developers → API Keys → Edit this key, enable Voices: Read as well as Text to Speech. Save the permission change (the key itself does not need to be replaced), then restart the app.";
  }
  if (message.includes("text_to_speech") || (message.includes("permission") && message.includes("text to speech"))) {
    return "ElevenLabs key is missing Text to Speech permission. Edit the same key in Developers → API Keys and enable Text to Speech access.";
  }
  if (status === 403) {
    return `ElevenLabs blocked the ${phase} request (403). Check this key's endpoint permissions and remove any IP allowlist that excludes this computer/server.`;
  }
  return "ElevenLabs did not recognize this API key (401). Check that the key has not been deleted, expired, revoked, or pasted incorrectly. Do not paste the key into chat.";
}

function configuredVoiceId(lang: "en" | "ur" | "roman" | "sd"): string | undefined {
  const envName: Record<typeof lang, string> = {
    en: "ELEVENLABS_VOICE_ID_EN",
    ur: "ELEVENLABS_VOICE_ID_UR",
    roman: "ELEVENLABS_VOICE_ID_ROMAN",
    sd: "ELEVENLABS_VOICE_ID_SD",
  };
  const explicit = process.env[envName[lang]]?.trim();
  if (explicit) return explicit;
  if (lang === "roman") return process.env["ELEVENLABS_VOICE_ID_UR"]?.trim() || undefined;
  return undefined;
}

async function resolveVoice(key: string, lang: "en" | "ur" | "roman" | "sd"): Promise<{ voiceId: string; voiceName: string } | null> {
  const configured = configuredVoiceId(lang);
  if (configured) return { voiceId: configured, voiceName: "configured voice" };
  const language = voiceLang[lang];
  const cacheKey = `${language}:female`;
  const cached = selectedVoiceCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return { voiceId: cached.voiceId, voiceName: cached.voiceName };

  // Read only voices actually available to this account, then rank by verified language
  // metadata. Do not assume the first voice in the account supports the selected language.
  let response: Response;
  try {
    response = await fetch("https://api.elevenlabs.io/v2/voices?page_size=100", {
      headers: { "xi-api-key": key },
      signal: AbortSignal.timeout(7000),
    });
  } catch {
    throw new Error("Could not reach ElevenLabs. Check your connection and try again.");
  }
  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error(`ElevenLabs voice lookup failed [${response.status}]: ${details}`);
    if (response.status === 401 || response.status === 403) throw new Error(authErrorMessage(response.status, details, "voice lookup"));
    if (response.status === 429) throw new Error("ElevenLabs rate limit or credits reached. Check your ElevenLabs plan and try again.");
    throw new Error("ElevenLabs could not list your available voices. Check the server logs and try again.");
  }
  const result = await response.json().catch(() => null) as { voices?: ElevenVoice[] } | null;
  const voices = (result?.voices ?? []).filter((voice) => typeof voice.voice_id === "string" && voice.voice_id.length > 0);
  const score = (voice: ElevenVoice) => {
    const gender = (voice.labels?.gender ?? "").toLowerCase();
    const accent = (voice.labels?.accent ?? "").toLowerCase();
    const verified = (voice.verified_languages ?? []).some((entry) => entry.language?.toLowerCase() === language);
    if (!verified && language !== "en") return -1000;
    let value = verified ? 100 : 0;
    if (gender === "female") value += 10;
    if ((lang === "ur" || lang === "roman") && /(pakistan|pakistani|desi|south asian)/.test(accent)) value += 15;
    if (lang === "en" && /(british|uk|american)/.test(accent)) value += 3;
    return value;
  };
  voices.sort((a, b) => score(b) - score(a));
  const first = voices[0];
  if (first?.voice_id && score(first) >= 0) {
    const match = { voiceId: first.voice_id, voiceName: first.name || "ElevenLabs voice" };
    selectedVoiceCache.set(cacheKey, { ...match, expiresAt: Date.now() + 30 * 60 * 1000 });
    return match;
  }
  return null;
}

/** Generates voice audio server-side so ElevenLabs credentials never reach the browser. */
export const synthesizeSpeech = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ text: z.string().trim().min(1).max(2500), lang: speechLangSchema }).parse(data))
  .handler(async ({ data }) => {
    const key = process.env["ELEVENLABS_API_KEY"]?.trim();
    if (!key || /^(your_|put_your|replace_me)/i.test(key)) {
      return {
        ok: false as const,
        useBrowserFallback: false as const,
        error: "ElevenLabs is not configured. Add a real ELEVENLABS_API_KEY to the server .env file and restart the app. Browser voices are disabled so an unrelated Microsoft/system voice is not played accidentally.",
      };
    }

    const lang = data.lang;
    let selected: { voiceId: string; voiceName: string } | null;
    try {
      selected = await resolveVoice(key, lang);
    } catch (error) {
      return { ok: false as const, useBrowserFallback: false as const, error: error instanceof Error ? error.message : "ElevenLabs voice lookup failed." };
    }
    if (!selected) {
      const languageName = lang === "sd" ? "Sindhi" : lang === "en" ? "English" : "Urdu";
      return {
        ok: false as const,
        useBrowserFallback: false as const,
        error: `No voice verified for ${languageName} was found in your ElevenLabs account. Add/select a compatible voice in My Voices or set ELEVENLABS_VOICE_ID_${lang.toUpperCase()} in .env. No unrelated browser voice will be substituted.`,
      };
    }

    const languageCode = voiceLang[lang];
    const model = process.env["ELEVENLABS_MODEL"] || "eleven_v3";
    let response: Response;
    try {
      response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(selected.voiceId)}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": key, Accept: "audio/mpeg" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          text: data.text,
          model_id: model,
          language_code: languageCode,
          voice_settings: { stability: 0.55, similarity_boost: 0.76, style: 0.05, speed: 0.88, use_speaker_boost: true },
        }),
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      return { ok: false as const, useBrowserFallback: false as const, error: timedOut ? "ElevenLabs took too long to respond. Please retry; your text is still available." : "Could not reach ElevenLabs. Check your connection and try again." };
    }
    if (!response.ok) {
      const details = await response.text().catch(() => "");
      console.error(`ElevenLabs speech error [${response.status}] language=${languageCode} model=${model}: ${details}`);
      if (response.status === 401 || response.status === 403) return { ok: false as const, useBrowserFallback: false as const, error: authErrorMessage(response.status, details, "speech generation") };
      if (response.status === 422) return { ok: false as const, useBrowserFallback: false as const, error: "ElevenLabs rejected this voice or language setting. Choose a voice that supports the selected language and check ELEVENLABS_MODEL." };
      if (response.status === 429) return { ok: false as const, useBrowserFallback: false as const, error: "ElevenLabs rate limit or credits reached. Please check your plan and try again." };
      return { ok: false as const, useBrowserFallback: false as const, error: "ElevenLabs could not generate speech right now. Check the server logs and try again." };
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) return { ok: false as const, useBrowserFallback: false as const, error: "ElevenLabs returned an empty audio file. Please try again." };
    return { ok: true as const, audioBase64: bytes.toString("base64"), mimeType: response.headers.get("content-type") || "audio/mpeg", voiceName: selected.voiceName };
  });
