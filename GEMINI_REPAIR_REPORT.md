# SCIENCE EXPLORER — Gemini integration repair (current update)

The shared server-side adapter now prefers `gemini-3.5-flash-lite` and falls back to `gemini-3.8-flash` for eligible service/model errors. Tutor requests use low/minimal thinking, short output, a 30-second overall timeout, up to 14 seconds per model attempt, automatic fallback after transient timeout/availability errors, and clearer failures. The Lovable gateway path also has a bounded timeout and returns a readable message if its stream is interrupted. The Tutor's AI Overview can make a real test request and display the actual elapsed time/result; key presence alone is not described as a successful connection. Existing Lovable gateway fallback remains available when no real Gemini key is configured.

No real API key is included. Live requests, test suite, lint and production build were not run in this environment. See `FINAL_REPORT.md` and `GEMINI_SETUP.md` for details.


## Tutor timeout follow-up fix

The previous Tutor deadline was only six seconds total, with each Gemini model attempt capped at 3.5 seconds. That was too short for normal provider/network variation and could prevent the fallback model from completing. The updated adapter now allows 30 seconds overall and up to 14 seconds per model attempt, while retaining a hard timeout and automatic model fallback. No API key, quota, billing, or account settings are changed.

The project archive does not contain the user's private `.env` file or API keys. A live provider test still requires the user's own configured server environment.
