# SCIENCE EXPLORER — AI and voice repair (current update)

This report is superseded by `FINAL_REPORT.md`. The current adapter uses `gemini-3.5-flash-lite` with `gemini-3.8-flash` fallback, bounded tutor requests, and a real live-connectivity diagnostic in AI Overview. ElevenLabs voice generation is server-side, has bounded request timeouts and specific authentication/language/quota errors. Browser-native speech fallback remains disabled.

No real API keys are included. An invalid/revoked/restricted ElevenLabs key still needs to be replaced in the local server `.env`; the project cannot repair a provider credential. Full builds/tests and live provider requests were not run because dependency installation timed out and no external credentials were provided. See `FINAL_REPORT.md`, `GEMINI_SETUP.md`, and `VOICE_SETUP.md`.


## Follow-up: precise ElevenLabs permission diagnosis

The voice resolver calls `/v2/voices` before `/v1/text-to-speech`. Therefore a key with Text to Speech permission but without Voices: Read can fail during voice discovery and previously produced a generic “API key rejected” message. The server now inspects the provider error body and distinguishes missing `voices_read`, missing `text_to_speech`, invalid/expired/revoked key, and 403 IP/permission restrictions. The setup guide now documents both required scopes. This does not bypass provider authentication: the existing key must have the correct scopes and remain valid.
