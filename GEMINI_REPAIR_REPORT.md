# SCIENCE EXPLORER — Gemini integration repair (current update)

The shared server-side adapter now prefers `gemini-3.5-flash-lite` and falls back to `gemini-3.8-flash` for eligible service/model errors. Tutor requests use low/minimal thinking, short output, bounded attempts and clearer failures. The Tutor's AI Overview can make a real test request and display the actual elapsed time/result; key presence alone is not described as a successful connection. Existing Lovable gateway fallback remains available when no real Gemini key is configured.

No real API key is included. Live requests, test suite, lint and production build were not run in this environment. See `FINAL_REPORT.md` and `GEMINI_SETUP.md` for details.
