# SCIENCE EXPLORER — Topic Games & Matric Focus Update

## What changed

- Added **Create a game from your topic** to the existing Science Games hub.
- Added authenticated Gemini-backed generation of a safe, declarative game specification. The model returns story, objective, drag/drop cards, target zones, hints, feedback, reward and three end-of-game questions. The project runs the result through a predefined interaction engine; it does not execute AI-generated JavaScript or HTML.
- Added a responsive, touch-friendly interaction flow: drag cards on desktop or tap a card and then a zone on touch devices; check, reset, hints, short end quiz and results are included.
- Added a grade selector for **Classes 5–10**, defaulting to **Class 9** and highlighting Class 10 as Matric. The prompt explicitly prioritizes Classes 9–10, supports Classes 5–8 as school-age learners, and excludes preschool and First Year/Inter.
- Updated lesson grade defaults and validation to Classes 5–10, with Class 9 as the default.
- Updated **Space Mission** to use original CSS-drawn smiling planet characters inspired by the user-provided third solar-system reference. The activity asks learners to drag or tap the eight planet characters into **Planet 1–8** positions from the Sun outward. Added a clean deep-space background asset with dashed orbit paths and no poster labels; the same background is applied when an AI-generated game chooses the space world. Planet sprites include Earth land shapes and Saturn's rings.
- Added subject-specific glow/environment treatments to existing game worlds, including the chemistry/physics pages, and per-topic visual palettes for AI-generated game scenes.
- Added a **20-minute focus-session timer** on game pages. It is optional, can be paused/reset, and does not forcibly stop a game when the timer reaches zero.
- Added a small server-side `.env` loader to the configured TanStack Start entry, so local server-side API keys can be read from a real `.env` file while deployment-provided environment variables take precedence.
- Updated setup guidance and AI Overview messaging so a configured key is not automatically treated as proof of a successful live provider connection.
- No real Gemini or ElevenLabs secrets were added to the ZIP.

## API setup required on the user's machine

1. Extract the ZIP and open the folder that contains `package.json`.
2. In PowerShell, run `Copy-Item .env.example .env` (if `.env` already exists, preserve it instead of overwriting it), then run `notepad .env`.
3. Put the actual `GEMINI_API_KEY` and `ELEVENLABS_API_KEY` values in `.env`, without `VITE_` prefixes. Save the file. Do not share or upload `.env`.
4. Stop the dev server with `Ctrl+C`, run `npm install` if needed, then `npm run dev`.
5. In the app, use **AI Tutor → AI Overview → Test live AI response**. Gemini and ElevenLabs are separate services and must be tested separately.

The configured Gemini models are `gemini-3.5-flash-lite` first and `gemini-3.8-flash` as fallback. Current Google API docs list both as stable model IDs and explain that `minimal` thinking is not supported by Gemini 3.8 Flash; the request configuration uses `minimal` only for Flash-Lite and `low` for Flash.

## Validation and limitations

- Syntax transpilation passed for **129 TypeScript/TSX source files**, with zero syntax errors.
- ZIP integrity is checked after packaging.
- A full dependency install, production build, browser run, automated test suite, and live Gemini/ElevenLabs API calls could not be performed in this environment. Therefore, no claim is made that the user's keys are currently valid or that provider calls succeed. Use the in-app live tests with the user's own keys.
- As in all generated content, topic accuracy should be checked by testing sample prompts such as Gravity, Chemical Bonding, Photosynthesis and Fractions for the target grade; the application validates structure and allowed targets but cannot guarantee every AI-authored explanation is perfect.

## Scope

This update builds on the provided existing project ZIP. It does not replace authentication, Supabase, Scanner, AI Tutor, Chemistry or Physics modules. No First Year/Inter grade was added.
