# Gemini API setup

1. Put `GEMINI_API_KEY=...` in the server-side `.env` file beside `package.json`. Do not use a `VITE_` prefix and never commit/share the real `.env` file.
2. The default model is `gemini-3.5-flash-lite`, selected for quick tutor responses. If it is unavailable or overloaded, the app tries `gemini-3.8-flash`. You can set `GEMINI_MODEL` to either of these supported model IDs. The tutor uses minimal/low thinking and a bounded total response budget to avoid waiting indefinitely; provider/network speed still varies.
3. Restart the dev server after editing `.env` (`Ctrl+C`, then `npm run dev`).
4. A 404 after both model attempts usually means this API key/project cannot access either model or the Gemini API is not enabled. A 401/403 means the key or project restrictions need checking. A 429 usually means quota/rate limit; a 5xx may be temporary provider overload.
5. Open **AI Science Tutor → AI Overview → Test live AI response** to test the real server connection. A key being present is not treated as proof of connectivity.

The current model IDs are listed in the official Gemini documentation: https://ai.google.dev/gemini-api/docs/models.


## Important: create a real `.env` file

The application reads `process.env`, not the template file itself. Copy `.env.example` to `.env` in the same folder as `package.json`, replace the placeholder with a real `GEMINI_API_KEY`, save, stop the server, and restart `npm run dev`. On PowerShell: `Copy-Item .env.example .env`. Do not use a `VITE_` prefix and never share `.env`.
