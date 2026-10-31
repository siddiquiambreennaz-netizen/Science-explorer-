# SCIENCE EXPLORER voice setup (ElevenLabs)

The app generates speech through ElevenLabs on the server. The API key is never sent to the browser. Browser/system speech fallback is disabled, so the app will not silently switch to an unrelated voice when ElevenLabs fails. The AI text answer remains available even when speech generation fails.

## Setup

1. In ElevenLabs → Developers → API Keys, edit the key used by this app. Enable **Text to Speech** and **Voices: Read**. This project first lists the voices available to your account (`/v2/voices`) and then generates audio (`/v1/text-to-speech`), so Text to Speech alone is not enough for automatic voice selection. You can edit permissions on the existing key; you do not need to keep creating new keys.
2. In the project root (beside `package.json`), add these lines to `.env` and keep all existing Supabase and Gemini settings:

   ```env
   ELEVENLABS_API_KEY=your_actual_elevenlabs_api_key
   ELEVENLABS_MODEL=eleven_v3
   ```

3. Restart the dev server with Ctrl+C, then `npm run dev`.
4. The server inspects voices available to your account and ranks them by verified language metadata. Urdu and Roman Urdu use the Urdu language code; Sindhi uses the Sindhi language code. A specific accent cannot be guaranteed unless you verify the chosen voice with actual playback.
5. If automatic voice selection finds no suitable voice, add an appropriate voice to **My Voices** in ElevenLabs, choose `My Voices → ... → Copy voice ID`, and use the optional overrides below:

   ```env
   ELEVENLABS_VOICE_ID_EN=...
   ELEVENLABS_VOICE_ID_UR=...
   ELEVENLABS_VOICE_ID_ROMAN=...
   ELEVENLABS_VOICE_ID_SD=...
   ```

Voice IDs are account-specific. `ELEVENLABS_VOICE_ID_ROMAN` can be omitted to reuse the Urdu voice. This project does not invent voice IDs or include paid-service credentials.

## Troubleshooting authentication and audio

- **Voice-list 401/403:** first check **Voices: Read** permission. The app needs this permission to discover your account's language-compatible voices. Also enable **Text to Speech** for audio generation. A key with Text to Speech only can fail before speech generation begins. Edit the existing key permissions; repeatedly copying the same key will not add missing permissions.
- **Speech-generation 401/403:** check Text to Speech permission, key expiry/revocation, and any IP allowlist. A 401 with no missing-permission detail means ElevenLabs did not recognize the key; source-code changes cannot make a revoked/expired key valid.
- Keep the actual key on one line in `.env` beside `package.json`, never in browser code or chat, save the file, and fully restart the dev server. A source-code change cannot repair a revoked or invalid provider key.
- **No suitable voice found:** add a voice that supports the chosen language to your account or set the matching `ELEVENLABS_VOICE_ID_*` override.
- **422 voice/language error:** choose a compatible voice/model and verify `ELEVENLABS_MODEL`.
- **429:** check account limits/credits.
- **Timeout/network error:** the request is time-bounded; retry after checking your connection. Text output remains available even if TTS fails.

Official references:
- https://elevenlabs.io/docs/overview/models
- https://elevenlabs.io/docs/api-reference/text-to-speech/convert
- https://elevenlabs.io/docs/api-reference/voices/search
